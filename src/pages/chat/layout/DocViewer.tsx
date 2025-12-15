import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  X,
  Quote,
  ArrowLeft,
  Download,
  Loader2,
  Search,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { useChatStore } from "@/store/chatStore";
import { useDialogStore } from "@/store/dialogStore";
import {
  fetchDocumentContent,
  downloadDocument,
} from "@/services/documents.service";
import type { DocumentDetailResponse } from "@/types/UserType";

// 텍스트 정규화 (특수문자 제거, 공백 제거 후 비교)
const normalizeText = (text: string) => {
  return text
    .replace(/\[.*?\]/g, "") // [파일명] 같은 대괄호 태그 제거
    .replace(/[^\w\s가-힣]/g, "") // 특수문자 제거 (한글,영문,숫자만 남김)
    .replace(/\s+/g, "") // 공백 제거
    .toLowerCase();
};

export function DocViewer() {
  const {
    selectedReference,
    setSelectedReference,
    selectedDocument,
    closeDocument,
  } = useChatStore();

  const dialog = useDialogStore();

  // 문단 요소들을 참조하기 위한 Refs
  const paragraphRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // 현재 하이라이트된 문단 인덱스
  const [highlightedIdx, setHighlightedIdx] = useState<number | null>(null);

  // 1. 문서 상세 내용 조회 Query
  const {
    data: docDetail,
    isLoading,
    isError,
  } = useQuery<DocumentDetailResponse>({
    queryKey: ["docContent", selectedDocument?.id],
    queryFn: () => {
      if (!selectedDocument) throw new Error("No document selected");
      return fetchDocumentContent(selectedDocument.id);
    },
    enabled: !!selectedDocument,
    staleTime: 1000 * 60 * 5,
  });

  // 2. 참조(Reference) 변경 시 이동 로직 (개선됨)
  useEffect(() => {
    if (!selectedReference || !docDetail?.chunks) return;

    // 1. 검색어 준비 (근거 텍스트에서 일부만 잘라서 검색할 수도 있음)
    // contextUsed 전체가 너무 길면 검색이 안 될 수 있으므로,
    // 여기서는 전체를 정규화해서 비교하거나, chunks를 순회하며 유사도를 봅니다.
    const targetText = normalizeText(selectedReference.text);
    if (!targetText) return;

    // 2. 가장 유사한 청크 찾기
    // (단순 includes 비교)
    const foundChunk = docDetail.chunks.find((chunk) => {
      const chunkText = normalizeText(chunk.content);
      // 근거 텍스트가 청크의 일부이거나, 청크가 근거 텍스트의 일부인 경우
      return chunkText.includes(targetText) || targetText.includes(chunkText);
    });

    if (foundChunk) {
      const pIdx = foundChunk.paragraph_idx;
      setHighlightedIdx(pIdx);

      const element = paragraphRefs.current[pIdx];
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      // 못 찾았을 경우: 전체 텍스트에서라도 검색 시도 (Optional)
      setHighlightedIdx(null);
      console.warn("일치하는 문단을 찾을 수 없습니다.");
    }
  }, [selectedReference, docDetail]);

  // 3. 다운로드 핸들러
  const handleDownload = async () => {
    if (!selectedDocument) return;
    try {
      await downloadDocument(
        selectedDocument.id,
        selectedDocument.originalFilename
      );
    } catch (error) {
      console.error("Download failed:", error);
      dialog.alert({ message: "다운로드에 실패했습니다.", variant: "error" });
    }
  };

  // 4. 화면 렌더링 로직 (상태별 분기)
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 h-full pb-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">문서를 분석하고 있습니다...</p>
        </div>
      );
    }

    if (isError || !docDetail) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-400">
          <FileText className="w-12 h-12 opacity-20 mb-4" />
          <p className="font-bold">문서 내용을 불러올 수 없습니다.</p>
        </div>
      );
    }

    // [복구됨] 문서 내용은 비어있고 청크도 없는 경우 (빈 문서 상태)
    if (
      (!docDetail.content || docDetail.content.trim() === "") &&
      (!docDetail.chunks || docDetail.chunks.length === 0)
    ) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <AlertCircle className="w-12 h-12 opacity-20 mb-4" />
          <p className="font-bold">문서 내용이 비어있습니다.</p>
          <p className="text-xs mt-1">
            파일이 손상되었거나 텍스트를 추출할 수 없습니다.
          </p>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto bg-white min-h-full p-8 md:p-12 shadow-sm">
        <div className="space-y-4 font-serif text-slate-800 leading-relaxed text-[15px]">
          {docDetail.chunks && docDetail.chunks.length > 0 ? (
            // Chunks 기반 렌더링 (하이라이팅 가능)
            docDetail.chunks.map((chunk) => {
              const isHighlighted = chunk.paragraph_idx === highlightedIdx;
              return (
                <div
                  key={chunk.paragraph_idx}
                  id={`paragraph-${chunk.paragraph_idx}`}
                  ref={(el) => {
                    paragraphRefs.current[chunk.paragraph_idx] = el;
                  }}
                  className={`transition-colors duration-1000 ease-in-out px-2 py-1 rounded ${
                    isHighlighted
                      ? "bg-yellow-100 ring-2 ring-yellow-300/50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {chunk.content}
                </div>
              );
            })
          ) : (
            // Chunks가 없는 경우 통문장 렌더링 (하위 호환)
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600">
              {docDetail.content}
            </pre>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden border-l border-gray-200">
      {/* 헤더 영역 */}
      <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white z-10">
        <div className="flex items-center gap-2 overflow-hidden">
          {!selectedReference && (
            <Button
              variant="ghost"
              size="icon"
              onClick={closeDocument}
              className="h-8 w-8 hover:bg-gray-100 text-gray-600 shrink-0"
            >
              <ArrowLeft size={18} />
            </Button>
          )}

          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              {selectedReference ? (
                <>
                  <Quote className="size-4 text-blue-600 shrink-0" />
                  <span className="truncate">문맥 확인 모드</span>
                </>
              ) : (
                <>
                  <FileText className="size-4 text-slate-500 shrink-0" />
                  <span
                    className="truncate"
                    title={selectedDocument?.originalFilename}
                  >
                    {selectedDocument?.originalFilename || "문서 뷰어"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!selectedReference && selectedDocument && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 text-slate-600 gap-1.5 px-3 text-xs"
            >
              <Download size={14} />
              다운로드
            </Button>
          )}

          {selectedReference && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedReference(null);
                setHighlightedIdx(null);
              }}
              className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              title="문맥 모드 종료"
            >
              <X size={18} />
            </Button>
          )}
        </div>
      </div>

      {/* 본문 뷰어 영역 */}
      <div className="flex-1 overflow-y-auto bg-slate-50 relative custom-scrollbar">
        {renderContent()}
      </div>

      {/* 문맥 모드 안내 바 */}
      {selectedReference && (
        <div className="flex-none bg-blue-600 text-white p-3 text-xs flex items-center justify-center gap-2 shadow-lg z-20">
          <Search size={14} className="animate-pulse" />
          <span>AI가 참조한 문맥 위치로 이동했습니다.</span>
        </div>
      )}
    </div>
  );
}
