import { useDocumentStore, type BackgroundTask } from "@/store/documentStore";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  FileUp,
  FileCheck,
} from "lucide-react";

export function UploadStatusBox() {
  // [수정] uploadQueue -> taskQueue, removeUploadFromQueue -> removeTask
  const { taskQueue, removeTask, retryUpload } = useDocumentStore();

  if (taskQueue.length === 0) return null;

  // 작업 유형별 아이콘 및 텍스트 렌더링 헬퍼
  const renderTaskInfo = (task: BackgroundTask) => {
    // 1. 공통 상태 아이콘
    let StatusIcon = Loader2;
    let iconColor = "text-blue-500";

    if (task.status === "COMPLETED") {
      StatusIcon = CheckCircle2;
      iconColor = "text-green-500";
    } else if (task.status === "ERROR") {
      StatusIcon = AlertCircle;
      iconColor = "text-red-500";
    }

    // 2. 작업 유형별 메시지
    let typeLabel = "";
    let statusMessage = "";

    if (task.type === "UPLOAD") {
      typeLabel = "파일 업로드";
      if (task.status === "UPLOADING")
        statusMessage = `업로드 중 (${task.progress.toFixed(0)}%)`;
      else if (task.status === "PARSING")
        statusMessage = `분석 중 (${task.progress.toFixed(0)}%)`;
    } else {
      typeLabel = "요청 승인 처리";
      if (task.status === "PROCESSING")
        statusMessage = `처리 중...`; // 서버가 progress 안 주면 ... 표시
      else if (task.status === "COMPLETED") statusMessage = "승인 완료";
    }

    if (task.status === "ERROR") statusMessage = "실패";
    else if (task.status === "COMPLETED") statusMessage = "완료됨";

    return { StatusIcon, iconColor, typeLabel, statusMessage };
  };

  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-3 w-[360px]">
      {taskQueue.map((task) => {
        const { StatusIcon, iconColor, typeLabel, statusMessage } =
          renderTaskInfo(task);

        return (
          <div
            key={task.id}
            className={`
              p-4 rounded-xl shadow-lg border bg-white flex flex-col gap-3
              ${task.status === "ERROR" ? "border-red-100" : "border-blue-100"}
              animate-in slide-in-from-bottom-2 fade-in duration-300
            `}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* 작업 유형 아이콘 (왼쪽) */}
                <div
                  className={`p-2 rounded-full ${
                    task.status === "ERROR" ? "bg-red-50" : "bg-blue-50"
                  }`}
                >
                  {task.type === "UPLOAD" ? (
                    <FileUp
                      size={18}
                      className={
                        task.status === "ERROR"
                          ? "text-red-500"
                          : "text-blue-600"
                      }
                    />
                  ) : (
                    <FileCheck
                      size={18}
                      className={
                        task.status === "ERROR"
                          ? "text-red-500"
                          : "text-blue-600"
                      }
                    />
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  {/* ▼ [수정] 여기에 typeLabel을 사용해서 경고를 없애고 정보를 보여줍니다. */}
                  <span className="text-[10px] font-bold text-gray-400 leading-none mb-0.5">
                    {typeLabel}
                  </span>
                  <span className="font-semibold text-sm truncate text-slate-800">
                    {task.fileName} {/* 문서명 표시 */}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <StatusIcon
                      className={`w-3.5 h-3.5 ${
                        task.status !== "COMPLETED" && task.status !== "ERROR"
                          ? "animate-spin"
                          : ""
                      } ${iconColor}`}
                    />
                    <span>{statusMessage}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => removeTask(task.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* 진행률 바 (공통) */}
            {task.status !== "COMPLETED" && task.status !== "ERROR" && (
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            )}

            {/* 에러 재시도 버튼 (업로드만 해당) */}
            {task.status === "ERROR" && task.type === "UPLOAD" && (
              <div className="bg-red-50 p-2 rounded flex justify-between items-center">
                <span className="text-xs text-red-600 truncate max-w-[200px]">
                  {task.errorMessage}
                </span>
                <button
                  onClick={() => retryUpload(task.id)}
                  className="text-xs flex gap-1 text-red-600 font-bold hover:underline"
                >
                  <RefreshCw size={12} />
                  재시도
                </button>
              </div>
            )}
            {/* 에러 메시지 (요청 승인 실패 시) */}
            {task.status === "ERROR" && task.type === "REQUEST" && (
              <div className="bg-red-50 p-2 rounded">
                <span className="text-xs text-red-600 block truncate">
                  {task.errorMessage}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
