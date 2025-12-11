import { useEffect, useMemo } from "react";
import { FileText, Loader2 } from "lucide-react"; // 아이콘 몇 개 추가했습니다
import { useQuery } from "@tanstack/react-query"; // React Query 사용

import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useDocumentStore } from "@/store/documentStore";

// API 함수 임포트
import { fetchDepartments, fetchProjects } from "@/services/system.service";

export function DocList() {
  const { openDocument } = useChatStore();
  const { user } = useAuthStore();
  const { documents, isLoading, fetchDocuments, setContext } =
    useDocumentStore();

  // ========================================================================
  // 1. [추가] 부서 및 프로젝트 메타데이터 미리 조회 (매핑용)
  // ========================================================================

  // 1-1. 전체 부서 목록 조회
  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
    staleTime: 1000 * 60 * 30, // 30분간 캐시 유지 (자주 안바뀜)
  });

  // 1-2. 전체 프로젝트 목록 조회
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    staleTime: 1000 * 60 * 30, // 30분간 캐시 유지
  });

  // 1-3. ID -> Name 매핑을 위한 Lookup Map 생성 (O(1) 접근)
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
      acc[proj.id] = proj.name; // system.service.ts에서 project_name -> name으로 변환됨
      return acc;
    }, {} as Record<number, string>);
  }, [projects]);

  // ========================================================================
  // 2. 기존 로직 (컨텍스트 설정 및 문서 로드)
  // ========================================================================

  useEffect(() => {
    if (user?.departmentId) {
      setContext(user.departmentId, user.projectId || 0);
    }
  }, [user?.departmentId, user?.projectId, setContext]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <div className="h-full flex flex-col">
      <div className="h-full overflow-y-auto custom-scrollbar ">
        {/* 문서 목록 영역 */}
        <div className="space-y-1 h-full">
          {isLoading && documents.length === 0 ? (
            <div className="flex flex-col h-full items-center justify-center text-gray-400 gap-2">
              <Loader2 className="animate-spin size-5" />
              <span className="text-xs">문서를 불러오는 중...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">
              등록된 문서가 없습니다.
            </div>
          ) : (
            documents.map((doc) => {
              // 매핑된 이름 가져오기 (없으면 ID 표시)
              const deptName = deptMap[doc.departmentId] || "";
              const projName = projectMap[doc.projectId] || "";

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
                    {/* 파일명 */}
                    <span className="truncate text-sm font-medium text-gray-700 group-hover:text-blue-900 mb-1">
                      {doc.originalFilename}
                    </span>

                    {/* 메타데이터 라인 */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 leading-none">
                      {/* 용량 */}
                      <span className="shrink-0">
                        {((doc.fileSize || 0) / 1024).toFixed(0)} KB
                      </span>

                      <span className="w-0.5 h-2 bg-gray-300 rounded-full" />

                      {/* [수정] 부서 및 프로젝트 표시 */}
                      <div className="flex items-center gap-1 max-w-full truncate  font-medium ">
                        {deptName && (
                          <span className="flex items-center gap-0.5">
                            {deptName}
                          </span>
                        )}
                        {deptName && projName && <span>/</span>}
                        {projName && (
                          <span className="flex items-center gap-0.5">
                            {projName}
                          </span>
                        )}
                        {/* 매핑 실패 시 ID라도 표시 (디버깅용) */}
                        {!deptName && !projName && (
                          <span>P-{doc.projectId}</span>
                        )}
                      </div>

                      <span className="w-0.5 h-2 bg-gray-300 rounded-full" />

                      {/* 날짜 */}
                      <span className="shrink-0">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>

                      {/* 상태 에러 표시 */}
                      {doc.status === "FAILED" && (
                        <span className="ml-auto text-red-500 font-medium shrink-0">
                          오류
                        </span>
                      )}
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
