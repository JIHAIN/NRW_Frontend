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
import { downloadDocument } from "@/services/documents.service"; //  다운로드 함수 추가

import type { Document } from "@/types/UserType";

interface RequestDetailModalProps {
  requestId: number | null;
  open: boolean;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export function RequestDetailModal({
  requestId,
  open,
  onClose,
  onApprove,
  onReject,
}: RequestDetailModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["requestDetail", requestId],
    queryFn: () => fetchRequestDetail(requestId!),
    enabled: !!requestId && open,
  });

  //  다운로드 핸들러 추가
  const handleDownload = async () => {
    const doc = data?.document;
    if (!doc) return;

    try {
      // ID 기반 다운로드 (이전에 수정한 API 사용)
      await downloadDocument(doc.id, doc.originalFilename);
    } catch (error) {
      console.error("Download failed:", error);
      alert("문서 다운로드에 실패했습니다.");
    }
  };

  if (!requestId) return null;

  const req = data?.request;
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
        ) : req ? (
          <div className="flex flex-col gap-6 py-2">
            {/* 1. 요청 정보 */}
            <section className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    요청 유형
                  </span>
                  <span className="font-semibold text-blue-600">
                    {req.request_type}
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
                    {req.status}
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
                    요청자 ID
                  </span>
                  <span>{req.requester_id}</span>
                </div>
                <div>
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
        ) : (
          <div className="py-10 text-center text-gray-500">
            정보를 불러올 수 없습니다.
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>

          {req?.status === "PENDING" && (
            <>
              <Button
                variant="destructive"
                onClick={() => onReject(req.id)}
                className="bg-white text-red-600 border border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" /> 반려
              </Button>
              <Button
                onClick={() => onApprove(req.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
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
