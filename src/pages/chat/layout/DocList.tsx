import { useEffect } from "react";
import { FileText, Plus, Search, Loader2 } from "lucide-react";
import { IconButton } from "@/components/common/IconButton";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useDocumentStore } from "@/store/documentStore";

export function DocList() {
  const { openDocument } = useChatStore();
  const { user } = useAuthStore();
  const { documents, isLoading, fetchDocuments, setContext } =
    useDocumentStore();

  // 1. 유저 정보(부서/프로젝트) 변경 시 스토어 컨텍스트 업데이트
  useEffect(() => {
    if (user?.departmentId) {
      setContext(user.departmentId, user.projectId || 0);
    }
  }, [user?.departmentId, user?.projectId, setContext]);

  // 2. 초기 마운트 시 로드
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]); // ✨ 의존성 배열 추가 (ESLint 해결)

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
        {/* 상단 검색창 및 버튼 */}
        <div className="mb-2 flex items-center justify-between">
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-100 px-2 py-1.5 flex-1 mr-2 bg-white">
            <Search className="size-4 text-blue-600" />
            <input
              placeholder="검색"
              className="w-full outline-none text-sm bg-transparent placeholder:text-gray-400"
            />
          </div>
          {/* ✨ className 오류 해결: div로 감싸서 마진 적용 */}
          <div className="mt-3">
            <IconButton label="새로 열기">
              <Plus className="size-4" />
            </IconButton>
          </div>
        </div>

        <div className="mt-5 mb-2 text-xs font-semibold text-blue-900/70 px-1">
          문서 목록
        </div>

        {/* 문서 목록 영역 */}
        <div className="space-y-1">
          {isLoading && documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
              <Loader2 className="animate-spin size-5" />
              <span className="text-xs">문서를 불러오는 중...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              등록된 문서가 없습니다.
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => openDocument(doc)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50/80 cursor-pointer group transition-colors border border-transparent hover:border-blue-110"
              >
                <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <FileText className="size-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate text-sm font-medium text-gray-700 group-hover:text-blue-900">
                    {doc.originalFilename}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                    {/* ✨ fileSize undefined 오류 해결 */}
                    <span>{((doc.fileSize || 0) / 1024).toFixed(0)} KB</span>
                    <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>

                    {/* 파싱 상태 표시 */}
                    {(doc.status === "PARSING" ||
                      doc.status === "EMBEDDING") && (
                      <span className="ml-auto text-blue-500 font-medium flex items-center gap-1">
                        <Loader2 className="size-3 animate-spin" />
                        처리중
                      </span>
                    )}
                    {/* ✨ ERROR -> FAILED 로 수정 (타입 일치) */}
                    {doc.status === "FAILED" && (
                      <span className="ml-auto text-red-500 font-medium">
                        오류
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
