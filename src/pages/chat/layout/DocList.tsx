import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useDocumentStore } from "@/store/documentStore";

// UserType 경로가 맞는지 확인해주세요
import type { Document } from "@/types/UserType";

// 서비스 함수들
import { fetchDepartments, fetchProjects } from "@/services/system.service";
import { getChatSessions } from "@/services/chat.service";
import { fetchDocumentTitles } from "@/services/documents.service";

// API 응답 타입 정의
interface ApiChatSession {
  id: number;
  user_id: number;
  title: string;
  is_deleted: number;
  refer_docs: number[];
  created_at: string;
  updated_at: string;
}

export function DocList() {
  // [수정 1] selectedSessionId 가져오기 (현재 어떤 방에 있는지 알아야 함)
  const { openDocument, selectedSessionId } = useChatStore();
  const { user } = useAuthStore();

  const { documents, isLoading, addDocuments, resetDocuments } =
    useDocumentStore();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // ========================================================================
  // 1. 부서 및 프로젝트 매핑 정보 (기존 유지)
  // ========================================================================
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
    staleTime: 1000 * 60 * 30,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    staleTime: 1000 * 60 * 30,
  });

  const deptMap = useMemo(() => {
    if (!departments) return {};
    return departments.reduce((acc, dept) => {
      acc[dept.id] = dept.dept_name;
      return acc;
    }, {} as Record<number, string>);
  }, [departments]);

  const projectMap = useMemo(() => {
    if (!projects) return {};
    return projects.reduce((acc, proj) => {
      acc[proj.id] = proj.name;
      return acc;
    }, {} as Record<number, string>);
  }, [projects]);

  // ========================================================================
  // 2. 채팅 세션 목록 조회
  // ========================================================================
  const { data: chatSessions } = useQuery<ApiChatSession[]>({
    queryKey: ["chatSessions", user?.id],
    queryFn: async () => {
      const result = await getChatSessions(user?.id || 0);
      return result as unknown as ApiChatSession[];
    },
    enabled: !!user?.id,
    // [중요] 세션 변경 시 즉각 반영을 위해 staleTime을 짧게 가져가거나 제거
    staleTime: 0,
  });

  // ========================================================================
  // 3. [핵심 수정] 현재 선택된 세션의 문서 ID만 추출
  // ========================================================================
  const targetDocIds = useMemo(() => {
    // 세션 데이터가 없거나, 선택된 세션이 없으면 빈 배열
    if (!chatSessions || !selectedSessionId) return [];

    // [중요] 전체 flatMap이 아니라, 현재 선택된 세션(selectedSessionId) 하나만 찾음
    // selectedSessionId는 string일 수 있으므로 비교 시 주의
    const currentSession = chatSessions.find(
      (s) => String(s.id) === String(selectedSessionId)
    );

    // 해당 세션이 없거나 문서가 없으면 빈 배열
    if (!currentSession || !currentSession.refer_docs) return [];

    // 중복 제거 후 반환
    return Array.from(new Set(currentSession.refer_docs));
  }, [chatSessions, selectedSessionId]); // selectedSessionId가 바뀔 때마다 재계산

  // ========================================================================
  // 4. 문서 목록 동기화 (경량 API + 리셋 로직 포함)
  // ========================================================================
  useEffect(() => {
    const loadTitles = async () => {
      // 1. 무조건 리셋 먼저 수행 (세션 변경 시 잔상 제거)
      resetDocuments();

      // 2. 가져올 문서 ID가 없으면 리셋된 상태(빈 화면)로 종료
      if (targetDocIds.length === 0) {
        return;
      }

      setIsSyncing(true);
      try {
        // 3. 현재 세션에 해당하는 문서 제목들만 가져옴
        const titles = await fetchDocumentTitles(targetDocIds);

        // 4. 데이터 매핑
        const newDocs: Document[] = titles.map((t) => ({
          id: t.id,
          originalFilename: t.original_filename,
          title: t.original_filename,
          content: "",
          userId: 0,
          departmentId: 0,
          projectId: 0,
          storedPath: "",
          fileExt: t.original_filename.split(".").pop() || "",
          category: "GENERAL",
          status: "PARSED",
          version: "1.0",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        // 5. 스토어 업데이트
        addDocuments(newDocs);
      } catch (error) {
        console.error("문서 목록 로드 실패:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    loadTitles();
  }, [targetDocIds, resetDocuments, addDocuments]);

  // ========================================================================
  // 5. UI 렌더링
  // ========================================================================
  const isPageLoading = isLoading || isSyncing;

  return (
    <div className="h-full flex flex-col">
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="space-y-1 h-full">
          {/* 로딩 중이면서 문서도 없을 때만 로딩 표시 */}
          {isPageLoading && (!documents || documents.length === 0) ? (
            <div className="flex flex-col h-full items-center justify-center text-gray-400 gap-2">
              <Loader2 className="animate-spin size-5" />
              <span className="text-xs">목록을 갱신하는 중...</span>
            </div>
          ) : !documents || documents.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">
              대화에 참조된 문서가 없습니다.
            </div>
          ) : (
            documents.map((doc: Document) => {
              const deptName = deptMap[doc.departmentId];
              const projName = projectMap[doc.projectId];

              return (
                <div
                  key={doc.id}
                  onClick={() => openDocument(doc)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50/80 cursor-pointer group transition-colors border border-transparent hover:border-blue-110"
                >
                  <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 group-hover:bg-white group-hover:shadow-sm transition-all shrink-0">
                    <FileText className="size-4" />
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate text-sm font-medium text-gray-700 group-hover:text-blue-900 mb-1">
                      {doc.originalFilename}
                    </span>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 leading-none">
                      <span className="w-0.5 h-2 bg-gray-300 rounded-full" />

                      {deptName || projName ? (
                        <div className="flex items-center gap-1 max-w-full truncate font-medium">
                          {deptName && <span>{deptName}</span>}
                          {deptName && projName && <span>/</span>}
                          {projName && <span>{projName}</span>}
                        </div>
                      ) : (
                        <span>DOC-{doc.id}</span>
                      )}

                      <span className="w-0.5 h-2 bg-gray-300 rounded-full" />
                      <span className="shrink-0">참조 문서</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
