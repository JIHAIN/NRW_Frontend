import { useQuery } from "@tanstack/react-query";
import { fetchDocuments } from "@/services/documents.service";
import { Ellipsis, FileText, Plus, Search, Settings } from "lucide-react";
import { Dropdown } from "@/components/common/Dropdown";
import { IconButton } from "@/components/common/IconButton";

/* ---------------- Sidebar ---------------- */
export function DocList() {
  //  API 호출
  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 flex-1 overflow-y-auto">
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
            //  진짜 데이터 매핑
            documents?.map((doc: any) => (
              <div
                key={doc.id} // 혹은 doc.doc_id
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50/80 cursor-pointer"
              >
                <FileText className="size-4 text-blue-700" />
                <span className="truncate text-sm">{doc.filename}</span>
              </div>
            ))
          )}
        </div>
      </div>

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
