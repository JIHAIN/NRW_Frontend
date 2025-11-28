import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileText, Calendar, Tag } from "lucide-react";

import type { Document } from "@/types/UserType";
import {
  fetchDocumentContent,
  downloadDocument,
} from "@/services/documents.service";
import { CATEGORY_LABEL, STATUS_CONFIG } from "@/constants/projectConstants";

interface DocumentDetailModalProps {
  document: Document | null;
  open: boolean;
  onClose: () => void;
}

export function DocumentDetailModal({
  document,
  open,
  onClose,
}: DocumentDetailModalProps) {
  // 1. 데이터 패칭 Hook (조건부 호출 오류 방지를 위해 최상단 배치)
  const {
    data: parsedText,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["docContent", document?.id], // 키는 ID 유지
    queryFn: () =>
      // [수정] user_id 제거, doc_id(파일명)만 전달
      fetchDocumentContent(document!.originalFilename),

    enabled: open && !!document,
    staleTime: 1000 * 60 * 5,
  });

  // 2. 데이터가 없으면 렌더링 안 함
  if (!document) return null;

  // ---------------------------------------------------------
  // 핸들러
  // ---------------------------------------------------------
  const handleDownload = async () => {
    try {
      await downloadDocument(document.id, document.originalFilename);
    } catch (e) {
      alert("다운로드에 실패했습니다.");
      console.error(e);
    }
  };

  const statusConfig =
    STATUS_CONFIG[document.status] || STATUS_CONFIG["UPLOADED"];
  const categoryLabel = CATEGORY_LABEL[document.category] || document.category;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[700px] bg-white max-h-[85vh] flex flex-col"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="text-blue-500" />
            문서 상세 정보
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-6 py-2">
          {/* 메타데이터 카드 */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400">파일명</span>
              <span
                className="font-medium text-slate-800 truncate"
                title={document.originalFilename}
              >
                {document.originalFilename}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400">상태</span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${statusConfig.dot}`}
                />
                <span className={statusConfig.color.replace("bg-", "text-")}>
                  {statusConfig.label}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Tag size={10} /> 분류
              </span>
              <span>{categoryLabel}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Calendar size={10} /> 업로드 일시
              </span>
              <span>{new Date(document.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* 파싱 결과 뷰어 */}
          <div className="flex-1 flex flex-col min-h-0 border rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b text-xs font-bold text-slate-500 flex justify-between items-center">
              <span>파싱된 텍스트 미리보기</span>
              {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-white text-sm leading-relaxed text-slate-700 font-mono">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  내용을 불러오는 중...
                </div>
              ) : isError ? (
                <div className="h-full flex flex-col items-center justify-center text-red-400 gap-2">
                  <span>내용을 불러올 수 없습니다.</span>
                  <span className="text-xs text-slate-400">
                    (서버에서 데이터를 찾을 수 없거나 처리 중입니다)
                  </span>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans">
                  {parsedText || "파싱된 텍스트 내용이 없습니다."}
                </pre>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <div className="text-xs text-slate-400 self-center">
            ID: {document.id} | Ver: {document.version}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
            <Button
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Download size={16} /> 원본 다운로드
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
