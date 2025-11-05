import { FileText } from "lucide-react";

/* ---------------- DocViewer -------------- */
export function DocViewer() {
  return (
    <div className="h-full rounded-xl  flex flex-col">
      <div className="flex items-center gap-2 text-sm py-1">
        <FileText className="size-4 text-blue-700  " />
        <span className="font-medium  ">업무지침_2409.pdf</span>
      </div>
      <div className="flex-1 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900/60 text-base overflow-y-auto mb-4">
        PDF/문서 미리보기 영역
      </div>
    </div>
  );
}
