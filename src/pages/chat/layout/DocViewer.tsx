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

const normalizeText = (text: string) => {
  return text
    .replace(/\[.*?\]/g, "")
    .replace(/[^\w\sㄱ-힣]/g, "")
    .replace(/\s+/g, "")
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
  const paragraphRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement | null>(null); // [추가] 컨테이너 스크롤 제어용

  // 하이라이트할 문단 번호
  const [highlightedParagraphIdx, setHighlightedParagraphIdx] = useState<
    number | null
  >(null);

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

  const chunks = useMemo(() => {
    if (!docDetail?.chunks) return [];
    return docDetail.chunks;
  }, [docDetail]);

  // --------------------------------------------------------------------------
  // [핵심 로직 수정] 스크롤 및 하이라이트 타겟팅
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!selectedReference || !chunks.length) return;

    let targetIdx: number | undefined = undefined;

    // 1. 목표 문단 번호 추출
    if (
      selectedReference.paragraphId !== undefined &&
      selectedReference.paragraphId !== null
    ) {
      targetIdx = Number(selectedReference.paragraphId);
    } else if (selectedReference.text) {
      // 텍스트 검색 fallback
      const targetText = normalizeText(selectedReference.text);
      if (targetText) {
        const found = chunks.find((c) => {
          const cText = normalizeText(c.content);
          return cText.includes(targetText) || targetText.includes(cText);
        });
        if (found) targetIdx = found.paragraph_idx;
      }
    }

    if (targetIdx !== undefined) {
      // 하이라이트 목표 설정 (원하는 번호 그대로)
      setHighlightedParagraphIdx(targetIdx);

      // [중요] 실제 화면에 존재하는 청크 찾기 (표 병합 대응)
      const visibleChunk = chunks.find((chunk) => {
        // A. 직접 일치
        if (Number(chunk.paragraph_idx) === targetIdx) return true;
        // B. 병합된 자식들(related_paragraphs) 중에 포함됨
        if (chunk.metadata?.related_paragraphs?.includes(targetIdx))
          return true;
        return false;
      });

      // 스크롤해야 할 실제 ID 결정
      // visibleChunk가 있으면 그 녀석(부모/본인)으로, 없으면 그냥 targetIdx 시도
      const scrollId = visibleChunk ? visibleChunk.paragraph_idx : targetIdx;

      setTimeout(() => {
        const element = paragraphRefs.current[scrollId];

        if (element) {
          // A. 요소를 찾았으면 거기로 스크롤
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          console.log(
            `📜 [DocViewer] ID ${scrollId}번으로 이동 성공 (타겟: ${targetIdx})`
          );
        } else {
          // B. [요청사항 반영] 요소를 못 찾았으면(DocViewer에 없는 번호) -> 최하단으로 이동
          console.warn(
            `⚠️ [DocViewer] ID ${scrollId}를 찾을 수 없음. 최하단으로 이동.`
          );
          if (containerRef.current) {
            containerRef.current.scrollTo({
              top: containerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        }
      }, 400); // 렌더링 시간 고려하여 여유있게 0.4초
    } else {
      setHighlightedParagraphIdx(null);
    }
  }, [selectedReference, chunks]);

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
      chunks.length === 0
    ) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <AlertCircle className="w-12 h-12 opacity-20 mb-4" />
          <p className="font-bold">문서 내용이 비어있습니다.</p>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto bg-white min-h-full px-2 py-10 md:px-6 md:py-7 shadow-sm">
        <div className="space-y-5">
          {chunks.length > 0 ? (
            chunks.map((chunk, index) => {
              // -------------------------------------------------------
              // [하이라이트 로직]
              // 1. 직접 일치 (본인 ID == 타겟 ID)
              // 2. 간접 일치 (내 자식 목록에 타겟 ID가 있음 -> 표 병합된 경우)
              // -------------------------------------------------------
              const isDirectMatch =
                Number(chunk.paragraph_idx) === Number(highlightedParagraphIdx);
              const isIndirectMatch =
                chunk.metadata?.related_paragraphs?.includes(
                  Number(highlightedParagraphIdx)
                );
              const isHighlighted = isDirectMatch || isIndirectMatch;

              const { cleanText, tables } = parseContentWithTables(
                chunk.content
              );

              return (
                <div
                  key={`${chunk.paragraph_idx}-${index}`}
                  className="flex gap-4 group"
                >
                  {/* 좌측 라인 넘버 */}
                  <div className="shrink-0 w-2 text-right pt-2.5 select-none">
                    <span
                      className={`text-[11px] font-mono transition-colors ${
                        isHighlighted
                          ? "text-blue-600 font-bold"
                          : "text-gray-300 group-hover:text-gray-400"
                      }`}
                    >
                      {chunk.paragraph_idx}
                    </span>
                  </div>

                  {/* 본문 콘텐츠 */}
                  <div
                    id={`paragraph-${chunk.paragraph_idx}`}
                    ref={(el) => {
                      if (chunk.paragraph_idx !== null) {
                        paragraphRefs.current[chunk.paragraph_idx] = el;
                      }
                    }}
                    className={`flex-1 min-w-0 transition-all duration-500 ease-in-out px-4 py-2 rounded-xl border-2 
                      ${
                        isHighlighted
                          ? "bg-blue-50 border-blue-300 shadow-lg ring-1 ring-blue-100"
                          : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                      }`}
                  >
                    {cleanText && (
                      <div className="prose prose-slate max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // ... (기존 마크다운 컴포넌트 유지)
                            p: (props) => (
                              <p
                                className="mb-4 leading-[1.85] text-[15.5px] text-slate-800 font-normal tracking-[-0.01em] last:mb-0"
                                {...props}
                              />
                            ),
                            h1: (props) => (
                              <h1
                                className="text-2xl font-bold text-slate-900 mb-4 mt-6 pb-2 border-b-2 border-slate-200"
                                {...props}
                              />
                            ),
                            h2: (props) => (
                              <h2
                                className="text-xl font-bold text-slate-900 mb-3 mt-5"
                                {...props}
                              />
                            ),
                            h3: (props) => (
                              <h3
                                className="text-lg font-semibold text-slate-800 mb-3 mt-4"
                                {...props}
                              />
                            ),
                            ul: (props) => (
                              <ul
                                className="list-disc pl-6 mb-4 space-y-2 marker:text-blue-500"
                                {...props}
                              />
                            ),
                            ol: (props) => (
                              <ol
                                className="list-decimal pl-6 mb-4 space-y-2 marker:text-blue-500 marker:font-semibold"
                                {...props}
                              />
                            ),
                            li: (props) => (
                              <li
                                className="pl-2 leading-[1.8] text-[15px] text-slate-700"
                                {...props}
                              />
                            ),
                            code: (props) => (
                              <code
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-sm font-mono border border-slate-200"
                                {...props}
                              />
                            ),
                            pre: (props) => (
                              <pre
                                className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm"
                                {...props}
                              />
                            ),
                            blockquote: (props) => (
                              <blockquote
                                className="border-l-4 border-blue-500 pl-4 py-2 my-4 italic text-slate-600 bg-slate-50 rounded-r"
                                {...props}
                              />
                            ),
                            table: (props) => (
                              <table
                                className="w-full text-sm text-left text-slate-700 border-collapse border border-slate-200 my-4"
                                {...props}
                              />
                            ),
                            th: (props) => (
                              <th
                                className="border border-slate-200 bg-slate-50 px-4 py-2 font-semibold"
                                {...props}
                              />
                            ),
                            td: (props) => (
                              <td
                                className="border border-slate-200 px-4 py-2"
                                {...props}
                              />
                            ),
                          }}
                        >
                          {cleanText}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* [요청사항 반영] 표 데이터 쪽에 다 하이라이트 걸기 */}
                    {tables.length > 0 && (
                      <div
                        className={`flex flex-col gap-6 mt-5 mb-3 rounded-lg p-2 transition-colors duration-500
                        ${
                          isIndirectMatch
                            ? "bg-yellow-100/70 border border-yellow-300 shadow-inner animate-pulse"
                            : ""
                        }`}
                      >
                        {isIndirectMatch && (
                          <div className="text-xs text-yellow-800 font-bold flex items-center gap-1 mb-1 px-1">
                            <Search size={12} />
                            <span>
                              문맥({highlightedParagraphIdx}번)이 포함된
                              표입니다
                            </span>
                          </div>
                        )}

                        {tables.map((table, idx) => (
                          <div
                            key={idx}
                            className={`overflow-hidden rounded-xl border-2 shadow-md bg-white
                              ${
                                isIndirectMatch
                                  ? "border-yellow-400 ring-2 ring-yellow-200/50"
                                  : "border-slate-200"
                              }`}
                          >
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-slate-200">
                                <thead
                                  className={
                                    isIndirectMatch
                                      ? "bg-yellow-50"
                                      : "bg-linear-to-r from-slate-100 to-slate-50"
                                  }
                                >
                                  <tr>
                                    {table.headers.map((h, i) => (
                                      <th
                                        key={i}
                                        className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wide border-b-2 border-slate-300 whitespace-nowrap"
                                      >
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                  {table.rows.map((row, rIdx) => (
                                    <tr
                                      key={rIdx}
                                      className={
                                        isIndirectMatch
                                          ? "hover:bg-yellow-50"
                                          : "hover:bg-blue-50 transition-colors duration-150"
                                      }
                                    >
                                      {row.map((cell, cIdx) => (
                                        <td
                                          key={cIdx}
                                          className="px-5 py-3.5 text-sm text-slate-700 whitespace-pre-wrap break-all leading-relaxed"
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
                </div>
              );
            })
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-[15px] text-slate-700 leading-relaxed">
              {docDetail.content}
            </pre>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden border-l border-gray-200">
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
                  <span className="truncate">
                    문맥 확인
                    {selectedReference.paragraphId !== undefined && (
                      <span className="ml-1 text-blue-500 font-mono">
                        ({selectedReference.paragraphId})
                      </span>
                    )}
                  </span>
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
                setHighlightedParagraphIdx(null);
              }}
              className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              title="문맥 모드 종료"
            >
              <X size={18} />
            </Button>
          )}
        </div>
      </div>

      {/* [수정] 스크롤 컨테이너에 ref 연결 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-linear-to-b from-slate-50 to-white relative custom-scrollbar"
      >
        {renderContent()}
      </div>

      {selectedReference && (
        <div className="flex-none bg-blue-600 text-white p-3 text-xs flex items-center justify-center gap-2 shadow-lg z-20">
          <Search size={14} className="animate-pulse" />
          <span>AI가 참조한 문맥 위치로 이동했습니다.</span>
        </div>
      )}
    </div>
  );
}
