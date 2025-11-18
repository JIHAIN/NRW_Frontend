import { useQuery } from "@tanstack/react-query";
import { fetchDocuments } from "@/services/documents.service";
import { Ellipsis, FileText, Plus, Search, Settings } from "lucide-react";
import { Dropdown } from "@/components/common/Dropdown";
import { IconButton } from "@/components/common/IconButton";
import type { Document } from "@/types/UserType"; // ✨ 타입 임포트

export function DocList() {
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
          최근 문서
        </div>

        <div className="space-y-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-xs text-gray-400">로딩 중...</div>
          ) : (
            // ✨ Document 타입 사용
            documents?.map((doc: Document) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50/80 cursor-pointer"
              >
                <FileText className="size-4 text-blue-700" />
                <span className="truncate text-sm">{doc.originalFilename}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ... (하단 메뉴 유지) ... */}
      <div className="p-3 border-t border-blue-100 flex items-center justify-between">
        <span className="text-xs text-blue-900/70">저장됨</span>
        <Dropdown
          align="end"
          items={[{ label: "설정", icon: <Settings className="size-4" /> }]}
        >
          <Ellipsis className="size-4" />
        </Dropdown>
      </div>
    </div>
  );
}
