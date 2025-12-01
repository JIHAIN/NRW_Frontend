import { useChatStore } from "@/store/chatStore";
import { FileText, X, Quote, ArrowLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
// ScrollArea 제거 (네이티브 스크롤 사용)
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
    queryKey: ["docContent", selectedDocument?.id],
    queryFn: () => {
      if (!selectedDocument) return null;
      // userId 제거, docId(파일명)만 전달 (API 변경 반영)
      return fetchDocumentContent(selectedDocument.id);
    },
    enabled: !!selectedDocument && !selectedReference,
    staleTime: 1000 * 60 * 5,
  });

  // 2. 다운로드 핸들러
  const handleDownload = async () => {
    if (!selectedDocument) return;
    try {
      await downloadDocument(
        selectedDocument.id,
        selectedDocument.originalFilename
      );
    } catch (error) {
      console.error("Download failed:", error);
      alert("다운로드에 실패했습니다.");
    }
  };

  return (
    // [전체 컨테이너] h-full과 overflow-hidden으로 부모 높이 상속 및 넘침 방지
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* ------------------------------------------------------- */}
      {/* 1. 고정 헤더 (flex-none으로 크기 고정) */}
      {/* ------------------------------------------------------- */}
      <div className="flex-none flex items-center  justify-between px-3 border-b border-blue-100 bg-white">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 overflow-hidden">
          {!selectedReference && (
            <Button
              variant="ghost"
              size="icon"
              onClick={closeDocument}
              className="h-8 w-8 mr-1 hover:bg-blue-50 text-blue-900 shrink-0"
            >
              <ArrowLeft size={18} />
            </Button>
          )}

          {selectedReference ? (
            <>
              <Quote className="size-4 text-blue-600 shrink-0" />
              <span className="truncate max-w-[200px]">참고 문맥 확인</span>
            </>
          ) : (
            <>
              <FileText className="size-4 text-slate-500 shrink-0" />
              <span
                className="truncate max-w-[200px]"
                title={selectedDocument?.originalFilename}
              >
                {selectedDocument?.originalFilename || "문서 뷰어"}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!selectedReference && selectedDocument && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 gap-1.5 px-2"
              title="다운로드"
            >
              <Download size={16} />
              <span className="text-xs hidden sm:inline">다운로드</span>
            </Button>
          )}

          {selectedReference && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedReference(null)}
              className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={18} />
            </Button>
          )}
        </div>
      </div>
      {/* ------------------------------------------------------- */}
      {/* 2. 스크롤 가능한 컨텐츠 영역 (flex-1, overflow-y-auto) */}
      {/* ------------------------------------------------------- */}

      <div className=" overflow-y-auto  bg-slate-50  custom-scrollbar ">
        {selectedReference ? (
          // [Mode 1] RAG 참고 문맥 표시
          <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm max-w-4xl mx-auto">
            <div className="text-xs font-bold text-blue-600 mb-3 flex items-center gap-1.5 pb-2 border-b border-blue-50">
              <FileText size={14} />
              출처: {selectedReference.sourceName}
            </div>
            <p className="text-sm leading-loose text-slate-700 font-serif">
              <span className="bg-yellow-100 text-slate-900 px-1 decoration-clone box-border rounded-sm">
                {selectedReference.text}
              </span>
            </p>
          </div>
        ) : selectedDocument ? (
          // [Mode 2] 전체 문서 내용
          <div className=" min-h-0 h-full p-2 md:p-10 max-w-6xl ">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-145 gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm font-medium">
                  문서 내용을 불러오는 중입니다...
                </p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center h-145 text-red-400">
                <FileText className="w-10 h-10 opacity-20" />
                <div className="text-center">
                  <p className="font-bold">문서 내용을 불러올 수 없습니다.</p>
                  <p className="text-xs mt-1 opacity-80">
                    서버 처리 중이거나 파일에 문제가 있을 수 있습니다.
                  </p>
                </div>
              </div>
            ) : (
              // 실제 텍스트 내용
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed wrap-break-words">
                {docContent || (
                  <span className="text-slate-400 italic">
                    추출된 텍스트 내용이 없습니다.
                  </span>
                )}
              </pre>
            )}
          </div>
        ) : (
          // [Mode 3] 대기 화면 (가운데 정렬을 위해 flex 사용)
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <FileText className="size-16 mb-4 opacity-20" />
            <p className="text-sm font-medium">
              왼쪽 목록에서 문서를 선택하세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
