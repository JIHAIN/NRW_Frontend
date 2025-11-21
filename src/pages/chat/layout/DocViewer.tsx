import { useChatStore } from "@/store/chatStore";
import { FileText, X, Quote, ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDocumentContent,
  downloadDocument,
} from "@/services/documents.service";

export function DocViewer() {
  const {
    selectedReference,
    setSelectedReference,
    selectedDocument,
    closeDocument,
  } = useChatStore();

  // 1. 문서 내용 조회 Query
  const {
    data: docContent,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["docContent", selectedDocument?.id], // ID가 바뀌면 다시 호출
    queryFn: () => {
      if (!selectedDocument) return null;
      // API 호출: userId와 docId(파일명) 전달
      return fetchDocumentContent(
        selectedDocument.userId,
        selectedDocument.originalFilename
      );
    },
    // 문서가 선택되었고, RAG 참조 모드가 아닐 때만 실행
    enabled: !!selectedDocument && !selectedReference,
  });

  // 2. 다운로드 핸들러
  const handleDownload = async () => {
    if (!selectedDocument) return;
    try {
      await downloadDocument(
        selectedDocument.userId,
        selectedDocument.originalFilename,
        selectedDocument.originalFilename
      );
    } catch (error) {
      console.error("Download failed:", error);
      alert("다운로드에 실패했습니다.");
    }
  };

  return (
    <div className="h-full rounded-xl flex flex-col bg-white border-l border-blue-50">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-2 border-b border-blue-100 h-10 shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          {/* 뒤로가기 버튼 (리스트로 복귀) */}
          {!selectedReference && (
            <Button
              variant="ghost"
              size="icon"
              onClick={closeDocument}
              className="h-7 w-7 mr-1 hover:bg-blue-50"
            >
              <ArrowLeft size={16} className="text-blue-900" />
            </Button>
          )}

          {selectedReference ? (
            <>
              <Quote className="size-4 text-blue-600" />
              <span className="truncate max-w-[150px]">참고 문맥</span>
            </>
          ) : (
            <>
              <FileText className="size-4 text-slate-500" />
              <span className="truncate max-w-[150px]">
                {selectedDocument?.originalFilename || "문서 뷰어"}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* ✨ 다운로드 버튼 (문서 보기 모드일 때만 노출) */}
          {!selectedReference && selectedDocument && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-8 w-8 text-slate-400 hover:text-blue-600"
              title="다운로드"
            >
              <Download size={16} />
            </Button>
          )}

          {/* RAG 참조 닫기 버튼 */}
          {selectedReference && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedReference(null)}
              className="h-8 w-8 text-slate-400 hover:text-slate-700"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <ScrollArea className="flex-1 p-0">
        {selectedReference ? (
          // [Mode 1] RAG 참고 문맥
          <div className="p-6">
            <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
              <div className="text-xs text-blue-600 mb-2 font-bold flex items-center gap-1">
                <FileText size={12} />
                {selectedReference.sourceName}
              </div>
              <p className="text-sm leading-loose text-slate-700 font-serif bg-yellow-50/50 p-2 rounded">
                <span className="bg-yellow-200 text-slate-900 px-1 py-0.5 rounded box-decoration-clone">
                  {selectedReference.text}
                </span>
              </p>
            </div>
          </div>
        ) : selectedDocument ? (
          // ✨ [Mode 2] 전체 문서 내용 (API 결과 표시)
          <div className="p-6 min-h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                문서를 불러오는 중입니다...
              </div>
            ) : isError ? (
              <div className="flex items-center justify-center h-40 text-red-400 text-sm">
                문서 내용을 불러올 수 없습니다.
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-serif leading-relaxed">
                {docContent || "내용이 없는 문서입니다."}
              </pre>
            )}
          </div>
        ) : (
          // [Mode 3] 대기 화면
          <div className="h-full flex flex-col items-center justify-center text-slate-400 mt-20">
            <FileText className="size-12 mb-3 opacity-20" />
            <p className="text-sm">문서를 선택하세요</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
