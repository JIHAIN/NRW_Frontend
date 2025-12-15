import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
import { parseContentWithTables } from "@/utils/markdownParser";

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

  // useMemo를 컴포넌트 최상위 레벨로 이동
  const sortedChunks = useMemo(() => {
    if (!docDetail?.chunks || docDetail.chunks.length === 0) {
      return [];
    }

    // 원본 배열 불변성 유지를 위해 slice() 후 sort()
    return docDetail.chunks.slice().sort((a, b) => {
      const idxA = a.paragraph_idx ?? 0;
      const idxB = b.paragraph_idx ?? 0;
      return idxA - idxB;
    });
  }, [docDetail]);

  // 2. 참조(Reference) 변경 시 이동 로직
  useEffect(() => {
    if (!selectedReference || !docDetail?.chunks) return;

    const targetText = normalizeText(selectedReference.text);
    if (!targetText) return;

    const foundChunk = docDetail.chunks.find((chunk) => {
      const chunkText = normalizeText(chunk.content);
      return chunkText.includes(targetText) || targetText.includes(chunkText);
    });

    if (foundChunk) {
      const pIdx = foundChunk.paragraph_idx;
      setHighlightedIdx(pIdx);

      setTimeout(() => {
        const element = paragraphRefs.current[pIdx];
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    } else {
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

  // 4. 화면 렌더링 로직
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
        <div className="space-y-6 font-serif text-slate-800 leading-relaxed text-[15px]">
          {sortedChunks.length > 0 ? (
            sortedChunks.map((chunk) => {
              const isHighlighted = chunk.paragraph_idx === highlightedIdx;
              const { cleanText, tables } = parseContentWithTables(
                chunk.content
              );

              return (
                <div
                  key={chunk.paragraph_idx}
                  id={`paragraph-${chunk.paragraph_idx}`}
                  ref={(el) => {
                    paragraphRefs.current[chunk.paragraph_idx] = el;
                  }}
                  className={`transition-colors duration-1000 ease-in-out px-4 py-2 rounded-lg border border-transparent ${
                    isHighlighted
                      ? "bg-yellow-100 border-yellow-200 shadow-sm"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* [수정 1] className 오류 해결을 위해 div로 감쌈 */}
                  {cleanText && (
                    <div className="whitespace-pre-wrap mb-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // [수정 2] node 변수 미사용 오류 해결 (node: _node)
                          p: ({ ...props }) => (
                            <p className="mb-2 last:mb-0" {...props} />
                          ),
                          ul: ({ ...props }) => (
                            <ul className="list-disc pl-5 mb-2" {...props} />
                          ),
                          ol: ({ ...props }) => (
                            <ol className="list-decimal pl-5 mb-2" {...props} />
                          ),
                        }}
                      >
                        {cleanText}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* 표 렌더링 */}
                  {tables.length > 0 && (
                    <div className="flex flex-col gap-4 mt-3 mb-2">
                      {tables.map((table, idx) => (
                        <div
                          key={idx}
                          className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white"
                        >
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  {table.headers.map((h, i) => (
                                    <th
                                      key={i}
                                      className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap"
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {table.rows.map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-gray-50">
                                    {row.map((cell, cIdx) => (
                                      <td
                                        key={cIdx}
                                        className="px-4 py-2 text-sm text-gray-700 whitespace-pre-wrap break-all"
                                      >
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
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
      <div className="flex-none flex items-center justify-between px-4 py-1 border-b border-gray-100 shadow-md shadow-gray-100 bg-white z-10">
        <div className="flex items-center gap-2 overflow-hidden">
          {!selectedReference && (
            <Button
              variant="ghost"
              size="icon"
              onClick={closeDocument}
              className="h-8 w-8 hover:bg-gray-100 text-gray-600 shrink-0 cursor-pointer"
            >
              <ArrowLeft size={18} />
            </Button>
          )}

          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              {selectedReference ? (
                <>
                  <Quote className="size-4 text-blue-600 shrink-0" />
                  <span className="truncate">문맥 확인</span>
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
              size="sm"
              onClick={handleDownload}
              className="h-8 text-slate-600 gap-1.5 px-3 text-xs cursor-pointer hover:bg-gray-100 hover:text-slate-900"
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
              className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
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
