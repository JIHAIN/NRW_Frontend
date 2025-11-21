import { useQuery } from "@tanstack/react-query";
import { fetchDocuments } from "@/services/documents.service";
import { FileText, Plus, Search } from "lucide-react";
import { IconButton } from "@/components/common/IconButton";
import type { Document } from "@/types/UserType"; // ✨ 타입 임포트
import { useChatStore } from "@/store/chatStore";

export function DocList() {
  const { openDocument } = useChatStore();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 flex-1 overflow-y-auto">
        {/* ... (상단 검색창 등 유지) ... */}
        <div className="mb-2 flex items-center justify-between">
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-100  px-2 py-1.5">
            <Search className="size-4 text-blue-600" />
            <input
              placeholder="검색"
              className="w-full outline-none text-sm bg-transparent"
            />
          </div>
          <IconButton label="새로 열기">
            <Plus className="size-4" />
          </IconButton>
        </div>

        <div className="mt-5 mb-2 text-xs font-semibold text-blue-900/70">
          참조 문서 예시
        </div>

        <div className="space-y-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-xs text-gray-400">로딩 중...</div>
          ) : (
            // ✨ Document 타입 사용
            documents?.map((doc: Document) => (
              <div
                key={doc.id}
                // 클릭 시 문서 열기 함수 실행
                onClick={() => openDocument(doc)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50/80 cursor-pointer"
              >
                <FileText className="size-4 text-blue-700" />
                <span className="truncate text-sm">{doc.originalFilename}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
