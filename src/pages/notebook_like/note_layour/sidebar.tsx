import { Ellipsis, FileText, Plus, Search, Settings } from "lucide-react";
import { Dropdown, IconButton } from "../notebook";

/* ---------------- Sidebar ---------------- */
export function Sidebar() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-xl bg-blue-100">
            🧠
          </span>
          <div className="font-semibold">AlAin</div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-2 py-1.5">
          <Search className="size-4 text-blue-600" />
          <input
            placeholder="검색"
            className="w-full outline-none text-sm bg-transparent"
          />
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold text-blue-900/70">노트북</div>
          <IconButton label="새 노트북">
            <Plus className="size-4" />
          </IconButton>
        </div>
        <nav className="space-y-1">
          {["프로젝트 제안서 요약", "계약서 검토", "정책 문서 QA"].map(
            (item, i) => (
              <button
                key={i}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50/80 focus:outline-none"
              >
                {item}
              </button>
            )
          )}
        </nav>

        <div className="mt-5 mb-2 text-xs font-semibold text-blue-900/70">
          최근 문서
        </div>
        <div className="space-y-1">
          {["업무지침_2409.pdf", "회의록_기관A.md", "내부규정_v12.docx"].map(
            (f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50/80"
              >
                <FileText className="size-4 text-blue-700" />
                <span className="truncate">{f}</span>
              </div>
            )
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
