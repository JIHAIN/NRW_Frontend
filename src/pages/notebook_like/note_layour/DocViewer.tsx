import { FileText } from "lucide-react";

/* ---------------- DocViewer -------------- */
export function DocViewer() {
  return (
    <section className="border-r border-blue-100 bg-white p-4 overflow-y-auto">
      <div className="mb-3 text-xs font-semibold text-blue-900/70">
        문서 뷰어
      </div>
      <div className="rounded-xl border border-blue-100 p-4 bg-white">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="size-4 text-blue-700" />
          <span className="font-medium">업무지침_2409.pdf</span>
        </div>
        <div className="mt-3 h-[420px] rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900/60 text-sm">
          PDF/문서 미리보기 영역
        </div>
      </div>
    </section>
  );
}
