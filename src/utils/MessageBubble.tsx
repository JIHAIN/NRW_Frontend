import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import {
  parseContentWithTables,
  type ParsedTable,
} from "@/utils/markdownParser";

// [수정] 타입 정의 확장
export interface SourceItem {
  name: string;
  docId?: number;
  paragraphId?: number;
  // 백엔드에서 raw data가 섞여 들어올 경우를 대비한 인덱스 시그니처
  [key: string]: any;
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isLatest?: boolean;
  // 어떤 형태의 배열이 와도 받도록 any 허용 (방어적)
  sources?: SourceItem[] | any[];
  contextUsed?: string;
  onSourceClick?: (source: SourceItem, context: string) => void;
}

const preprocessContent = (text: string) => {
  if (!text) return "";
  return text
    .replace(/^(\d+)\s+\./gm, "$1.")
    .replace(/\*\*\s+(.*?)\s+\*\*/g, "**$1**");
};

export const MessageBubble = ({
  role,
  content,
  isStreaming = false,
  isLatest = false,
  sources,
  contextUsed,
  onSourceClick,
}: MessageBubbleProps) => {
  const [isSourceOpen, setIsSourceOpen] = useState(isStreaming || isLatest);

  const { cleanText, tables } = useMemo(() => {
    if (isStreaming) {
      return { cleanText: content, tables: [] };
    }
    return parseContentWithTables(content);
  }, [content, isStreaming]);

  const textToRender = preprocessContent(cleanText);
  const isPreparing = isStreaming && content.length === 0;

  // [핵심] 초강력 필터링 및 정규화 로직
  const validSources = useMemo(() => {
    if (!sources || sources.length === 0) return [];

    return sources
      .map((s) => {
        // 들어오는 객체의 모양을 모르므로 안전하게 캐스팅
        const item = s as any;
        // 이름 우선순위: name -> doc_name -> original_filename
        const rawName =
          item.name || item.doc_name || item.original_filename || "";

        return {
          ...item,
          name: rawName, // 화면 표시용 이름 보정
        } as SourceItem;
      })
      .filter((s) => {
        if (!s.name) return false;
        const name = String(s.name).trim();
        const nameNoSpace = name.replace(/\s+/g, "");

        // 1. 빈 값 및 이상한 값 제거
        if (name === "" || name === "null" || name === "undefined")
          return false;

        // 2. 환각 텍스트 차단
        if (nameNoSpace === "문서내용" || name.includes("문서 내용"))
          return false;
        if (name.startsWith("문서 검색 결과")) return false;
        if (name.includes("대화 요약") || name === "대화 요약 문서")
          return false;
        if (nameNoSpace === "참조문서없음") return false;

        return true;
      });
  }, [sources]);

  return (
    <div
      className={`flex flex-col ${
        role === "user" ? "items-end" : "items-start"
      }`}
    >
      <Card
        className={`max-w-[85%] border-none p-0 ${
          role === "user"
            ? "bg-blue-500 text-white rounded-br-none shadow-md text-[0.92rem] shadow-blue-500"
            : "bg-gray-50 rounded-bl-none shadow-md text-[0.92rem] shadow-gray-300"
        }`}
      >
        <CardContent className="p-3 leading-relaxed break-all">
          {isPreparing ? (
            <div className="flex items-center gap-2 text-gray-500 py-1">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">답변 준비 중...</span>
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ ...props }) => (
                  <p className="mb-1 leading-relaxed last:mb-0" {...props} />
                ),
                ul: ({ ...props }) => (
                  <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />
                ),
                li: ({ ...props }) => <li className="pl-1" {...props} />,
                h1: ({ ...props }) => (
                  <h1 className="text-lg font-bold mt-4 mb-2" {...props} />
                ),
                h2: ({ ...props }) => (
                  <h2 className="text-base font-bold mt-3 mb-2" {...props} />
                ),
                h3: ({ ...props }) => (
                  <h3 className="text-sm font-bold mt-2 mb-1" {...props} />
                ),
                blockquote: ({ ...props }) => (
                  <blockquote
                    className="border-l-4 border-gray-300 pl-4 my-2 italic text-gray-500 bg-gray-50 py-1"
                    {...props}
                  />
                ),
                code: ({
                  className,
                  children,
                  ...props
                }: React.ComponentPropsWithoutRef<"code">) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match && !String(children).includes("\n");
                  return isInline ? (
                    <code
                      className="bg-gray-200 text-red-500 rounded px-1 py-0.5 text-xs font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <div className="my-2 w-full overflow-x-auto rounded-lg bg-slate-800 p-3 text-white">
                      <code
                        className="text-xs font-mono whitespace-pre"
                        {...props}
                      >
                        {children}
                      </code>
                    </div>
                  );
                },
                table: isStreaming
                  ? ({ ...props }) => (
                      <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
                        <table
                          className="min-w-full divide-y divide-gray-300"
                          {...props}
                        />
                      </div>
                    )
                  : () => <></>,
                th: ({ ...props }) => (
                  <th
                    className="bg-gray-100 px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b"
                    {...props}
                  />
                ),
                td: ({ ...props }) => (
                  <td
                    className="px-3 py-2 text-sm text-gray-700 border-b last:border-0 whitespace-pre-wrap"
                    {...props}
                  />
                ),
                a: ({ ...props }) => (
                  <a
                    className="text-blue-600 hover:underline cursor-pointer font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),
              }}
            >
              {textToRender}
            </ReactMarkdown>
          )}
        </CardContent>
      </Card>

      {!isStreaming && tables.length > 0 && (
        <div className="mt-3 w-full max-w-[85%] animate-in fade-in slide-in-from-top-2 duration-500 space-y-3">
          {tables.map((table: ParsedTable, idx: number) => (
            <div
              key={idx}
              className="overflow-hidden rounded-xl border border-gray-200 shadow-md bg-white"
            >
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                📊 표 데이터 {idx + 1}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {table.headers.map((h, i) => (
                        <th
                          key={i}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {table.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-gray-50">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-6 py-4 text-sm text-gray-700 whitespace-pre-wrap"
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

      {role === "assistant" && validSources.length > 0 && (
        <div className="mt-2 max-w-[85%]">
          <button
            onClick={() => setIsSourceOpen(!isSourceOpen)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors mb-2 ml-1"
          >
            {isSourceOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
            {isSourceOpen
              ? "근거 자료 접기"
              : `근거 자료 ${validSources.length}개 보기`}
          </button>

          {isSourceOpen && (
            <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {validSources.map((source, idx) => (
                <button
                  key={idx}
                  // [핵심] 객체 자체를 상위 핸들러로 전달
                  onClick={() =>
                    onSourceClick && onSourceClick(source, contextUsed || "")
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-700 hover:bg-gray-100 hover:border-blue-200 transition-all shadow-sm"
                  title={`문서 ID: ${source.docId}, 문단: ${source.paragraphId}`}
                >
                  <BookOpen size={12} />
                  <span className="truncate max-w-[200px]">{source.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
