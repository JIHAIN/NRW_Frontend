import { useDocumentStore } from "@/store/documentStore";
import { Loader2, CheckCircle2, AlertCircle, X, RefreshCw } from "lucide-react";

export function UploadStatusBox() {
  const { uploadQueue, removeUploadFromQueue, retryUpload } =
    useDocumentStore();

  if (uploadQueue.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-3 w-[340px]">
      {uploadQueue.map((item) => (
        <div
          key={item.fileName}
          className={`
          p-4 rounded-xl shadow-lg border bg-white flex flex-col gap-3
          ${item.status === "ERROR" ? "border-red-100" : "border-blue-100"}
        `}
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {item.status === "COMPLETED" ? (
                <CheckCircle2 className="text-green-500 w-5 h-5" />
              ) : item.status === "ERROR" ? (
                <AlertCircle className="text-red-500 w-5 h-5" />
              ) : (
                <Loader2 className="animate-spin text-blue-500 w-5 h-5" />
              )}

              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm truncate">
                  {item.fileName}
                </span>
                <span className="text-xs text-gray-500">
                  {item.status === "UPLOADING" &&
                    `업로드 중 (${item.progress.toFixed(0)}%)`}
                  {item.status === "PARSING" &&
                    `분석 중 (${item.progress.toFixed(0)}%)`}
                  {item.status === "COMPLETED" && "완료됨"}
                  {item.status === "ERROR" && "실패"}
                </span>
              </div>
            </div>
            <button onClick={() => removeUploadFromQueue(item.fileName)}>
              <X size={16} />
            </button>
          </div>

          {/* 통합 진행률 바 (0~100%) */}
          {(item.status === "UPLOADING" || item.status === "PARSING") && (
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          )}

          {item.status === "ERROR" && (
            <div className="bg-red-50 p-2 rounded flex justify-between items-center">
              <span className="text-xs text-red-600 truncate">
                {item.errorMessage}
              </span>
              <button
                onClick={() => retryUpload(item.fileName)}
                className="text-xs flex gap-1 text-red-600 font-bold"
              >
                <RefreshCw size={12} />
                재시도
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
