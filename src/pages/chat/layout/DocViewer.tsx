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
  // 문단 번호(paragraph_idx)를 키로 사용하여 요소 참조
  const paragraphRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // [수정] 하이라이트할 문단 번호 (paragraph_idx)
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

  // [핵심 기능] 스크롤 및 하이라이트 타겟팅 (paragraph_idx 기준)
  useEffect(() => {
    if (!selectedReference || !chunks.length) return;

    let targetParagraphIdx: number | undefined = undefined;

    // 1. paragraphId(문단 번호)가 명확히 있는 경우 (가장 우선)
    if (
      selectedReference.paragraphId !== undefined &&
      selectedReference.paragraphId !== null
    ) {
      targetParagraphIdx = Number(selectedReference.paragraphId);
    }
    // 2. 번호가 없을 때 텍스트 검색 (Fallback)
    else if (selectedReference.text) {
      const targetText = normalizeText(selectedReference.text);
      if (targetText) {
        const foundChunk = chunks.find((chunk) => {
          const chunkText = normalizeText(chunk.content);
          return (
            chunkText.includes(targetText) || targetText.includes(chunkText)
          );
        });
        if (foundChunk) {
          targetParagraphIdx = foundChunk.paragraph_idx;
        }
      }
    }

    if (targetParagraphIdx !== undefined) {
      // 1. 하이라이트 목표 문단 번호 설정
      setHighlightedParagraphIdx(targetParagraphIdx);

      // 2. 실제 화면에 렌더링된 청크 중에서 해당 문단 번호를 가진(혹은 포함한) 녀석 찾기
      const foundChunk = chunks.find((chunk) => {
        // (A) 문단 번호가 직접 일치하는 경우
        if (Number(chunk.paragraph_idx) === targetParagraphIdx) return true;

        // (B) [중요] 병합된 문단(표 등) 내부에 숨겨진 문단 번호인 경우
        if (chunk.metadata?.related_paragraphs?.includes(targetParagraphIdx))
          return true;

        return false;
      });

      // 3. 스크롤해야 할 타겟 문단 번호 결정
      const scrollTargetParagraphIdx = foundChunk
        ? foundChunk.paragraph_idx
        : targetParagraphIdx;

      setTimeout(() => {
        if (
          scrollTargetParagraphIdx !== null &&
          scrollTargetParagraphIdx !== undefined
        ) {
          const element = paragraphRefs.current[scrollTargetParagraphIdx];
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            console.warn(
              `스크롤 대상 문단(paragraph_idx: ${scrollTargetParagraphIdx})을 찾을 수 없습니다.`
            );
          }
        }
      }, 300);
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
          <p className="text-xs mt-1">
            파일이 손상되었거나 텍스트를 추출할 수 없습니다.
          </p>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto bg-white min-h-full px-2 py-4 md:px-6 md:py-7 shadow-sm">
        <div className="space-y-5">
          {chunks.length > 0 ? (
            chunks.map((chunk, index) => {
              // [수정] 하이라이트 여부 결정
              const isHighlighted =
                highlightedParagraphIdx !== null &&
                chunk.paragraph_idx !== null &&
                (Number(chunk.paragraph_idx) ===
                  Number(highlightedParagraphIdx) ||
                  chunk.metadata?.related_paragraphs?.includes(
                    Number(highlightedParagraphIdx)
                  ));

              const { cleanText, tables } = parseContentWithTables(
                chunk.content
              );
              return (
                // [수정] Layout 변경: 좌측에 라인 번호를 표시하기 위해 Flex 적용
                <div
                  key={`${chunk.paragraph_idx}-${index}`}
                  className="flex gap-4 group"
                >
                  {/* [수정] 좌측 라인 넘버 (paragraph_idx) */}
                  <div className="shrink-0 w-2 text-right pt-3 select-none">
                    <span className="text-[11px] font-mono text-gray-500 group-hover:text-gray-400 transition-colors">
                      {chunk.paragraph_idx})
                    </span>
                  </div>

                  {/* 콘텐츠 영역 */}
                  <div
                    id={`paragraph-${chunk.paragraph_idx}`}
                    ref={(el) => {
                      if (chunk.paragraph_idx !== null) {
                        paragraphRefs.current[chunk.paragraph_idx] = el;
                      }
                    }}
                    className={`flex-1 min-w-0 transition-all duration-300 ease-in-out px-4 py-2 rounded-xl ${
                      isHighlighted
                        ? "bg-blue-50 border-2 border-blue-200 shadow-md scale-[1.01]"
                        : "border-2 border-transparent hover:bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    {cleanText && (
                      <div className="prose prose-slate max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ ...props }) => (
                              <p
                                className="mb-4 leading-[1.85] text-[15.5px] text-slate-800 font-normal tracking-[-0.01em] last:mb-0"
                                {...props}
                              />
                            ),
                            h1: ({ ...props }) => (
                              <h1
                                className="text-2xl font-bold text-slate-900 mb-4 mt-6 pb-2 border-b-2 border-slate-200"
                                {...props}
                              />
                            ),
                            h2: ({ ...props }) => (
                              <h2
                                className="text-xl font-bold text-slate-900 mb-3 mt-5"
                                {...props}
                              />
                            ),
                            h3: ({ ...props }) => (
                              <h3
                                className="text-lg font-semibold text-slate-800 mb-3 mt-4"
                                {...props}
                              />
                            ),
                            h4: ({ ...props }) => (
                              <h4
                                className="text-base font-semibold text-slate-800 mb-2 mt-3"
                                {...props}
                              />
                            ),
                            ul: ({ ...props }) => (
                              <ul
                                className="list-disc pl-6 mb-4 space-y-2 marker:text-blue-500"
                                {...props}
                              />
                            ),
                            ol: ({ ...props }) => (
                              <ol
                                className="list-decimal pl-6 mb-4 space-y-2 marker:text-blue-500 marker:font-semibold"
                                {...props}
                              />
                            ),
                            li: ({ ...props }) => (
                              <li
                                className="pl-2 leading-[1.8] text-[15px] text-slate-700"
                                {...props}
                              />
                            ),
                            code: ({ ...props }) => (
                              <code
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-sm font-mono border border-slate-200"
                                {...props}
                              />
                            ),
                            pre: ({ ...props }) => (
                              <pre
                                className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm"
                                {...props}
                              />
                            ),
                            blockquote: ({ ...props }) => (
                              <blockquote
                                className="border-l-4 border-blue-500 pl-4 py-2 my-4 italic text-slate-600 bg-slate-50 rounded-r"
                                {...props}
                              />
                            ),
                            strong: ({ ...props }) => (
                              <strong
                                className="font-semibold text-slate-900"
                                {...props}
                              />
                            ),
                            em: ({ ...props }) => (
                              <em
                                className="italic text-slate-700"
                                {...props}
                              />
                            ),
                            a: ({ ...props }) => (
                              <a
                                className="text-blue-600 hover:text-blue-700 underline decoration-blue-300 hover:decoration-blue-500 transition-colors"
                                {...props}
                              />
                            ),
                            hr: ({ ...props }) => (
                              <hr
                                className="my-6 border-t-2 border-slate-200"
                                {...props}
                              />
                            ),
                          }}
                        >
                          {cleanText}
                        </ReactMarkdown>
                      </div>
                    )}

                    {tables.length > 0 && (
                      <div className="flex flex-col gap-6 mt-5 mb-3">
                        {tables.map((table, idx) => (
                          <div
                            key={idx}
                            className="overflow-hidden rounded-xl border-2 border-slate-200 shadow-md bg-white"
                          >
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-linear-to-r from-slate-100 to-slate-50">
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
                                      className="hover:bg-blue-50 transition-colors duration-150"
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
                      <span className="ml-1 text-blue-500">
                        (문단 {selectedReference.paragraphId})
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

      <div className="flex-1 overflow-y-auto bg-linear-to-b from-slate-50 to-white relative custom-scrollbar">
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
