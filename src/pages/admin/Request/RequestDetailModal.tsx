import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";

// API
import { fetchRequestDetail } from "@/services/request.service";
import { downloadDocument } from "@/services/documents.service";

import type { Document, RequestItem } from "@/types/UserType";
// [추가] 다이얼로그 스토어
import { useDialogStore } from "@/store/dialogStore";

interface RequestDetailModalProps {
  baseInfo: RequestItem | null;
  open: boolean;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export function RequestDetailModal({
  baseInfo,
  open,
  onClose,
  onApprove,
  onReject,
}: RequestDetailModalProps) {
  const requestId = baseInfo?.id;
  const dialog = useDialogStore(); // [추가] 다이얼로그 훅

  const { data, isLoading } = useQuery({
    queryKey: ["requestDetail", requestId],
    queryFn: () => fetchRequestDetail(requestId!),
    enabled: !!requestId && open,
  });

  const handleDownload = async () => {
    const doc = data?.document;
    if (!doc) return;

    try {
      await downloadDocument(doc.id, doc.originalFilename);
    } catch (error) {
      console.error("Download failed:", error);

      dialog.alert({
        title: "다운로드 실패",
        message: "문서 다운로드에 실패했습니다.",
        variant: "error",
      });
    }
  };

  // 상태값 한글 변환 함수
  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "대기중";
      case "APPROVED":
        return "승인됨";
      case "REJECTED":
        return "반려됨";
      default:
        return status;
    }
  };

  // 요청 유형 한글 변환 함수
  const getTypeText = (type: string) => {
    switch (type) {
      case "CREATE":
        return "문서 추가";
      case "UPDATE":
        return "문서 수정";
      case "DELETE":
        return "문서 삭제";
      default:
        return type;
    }
  };

  if (!baseInfo) return null;

  // data.request에 상세 내용이 있지만, 이름 등은 baseInfo 사용
  const req = data?.request || baseInfo;
  const doc: Document | null | undefined = data?.document;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>요청 상세 정보</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-2">
            {/* 1. 요청 정보 */}
            <section className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    요청 유형
                  </span>
                  <span className="font-semibold text-blue-600">
                    {getTypeText(baseInfo.request_type)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    상태
                  </span>
                  <span
                    className={`font-bold ${
                      req.status === "PENDING"
                        ? "text-yellow-600"
                        : req.status === "APPROVED"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {getStatusText(req.status)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-400 block mb-1">
                    요청 사유
                  </span>
                  <p className="text-slate-700 bg-white p-2 rounded border border-slate-200">
                    {req.content || "내용 없음"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    요청자
                  </span>
                  <span className="font-medium">{baseInfo.user_name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    프로젝트
                  </span>
                  <span className="font-medium">{baseInfo.project_name}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-slate-400 block mb-1">
                    요청 일시
                  </span>
                  <span>{new Date(req.created_at).toLocaleString()}</span>
                </div>
              </div>
            </section>

            {/* 2. 대상 문서 정보 */}
            {doc && (
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={16} /> 대상 문서 정보
                </h3>
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-full border border-blue-100 shrink-0">
                      <FileText className="text-blue-500" size={20} />
                    </div>

                    <div className="overflow-hidden flex-1">
                      <div
                        onClick={handleDownload}
                        className="flex items-center gap-2 cursor-pointer group w-fit"
                        title="문서 다운로드"
                      >
                        <p className="font-medium text-blue-900 truncate max-w-[350px] group-hover:underline group-hover:text-blue-700">
                          {doc.originalFilename}
                        </p>
                        <Download
                          size={14}
                          className="text-blue-400 group-hover:text-blue-600"
                        />
                      </div>

                      <p className="text-xs text-slate-500 mt-1 break-all">
                        {doc.storedPath}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-blue-100 pt-3">
                    <div>
                      <span className="text-xs text-slate-400">문서 상태</span>
                      <div className="text-slate-700 font-medium">
                        {doc.status}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">버전</span>
                      <div className="text-slate-700 font-medium">
                        {doc.version}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 3. 반려 사유 */}
            {req.rejection_reason && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-sm">
                <h4 className="text-red-600 font-bold mb-1 flex items-center gap-2">
                  <AlertCircle size={14} /> 반려 사유
                </h4>
                <p className="text-red-800">{req.rejection_reason}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {req?.status === "PENDING" && (
            <>
              <Button
                variant="destructive"
                onClick={() => onReject(req.id)}
                className="bg-white cursor-pointer text-red-600 border border-red-200 hover:bg-red-100"
              >
                <XCircle className="w-4 h-4 mr-2 " /> 반려
              </Button>
              <Button
                onClick={() => onApprove(req.id)}
                className="bg-blue-500 hover:bg-blue-700 cursor-pointer text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" /> 승인
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
