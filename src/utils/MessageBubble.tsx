import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import {
  parseContentWithTables,
  type ParsedTable,
} from "@/utils/markdownParser";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isLatest?: boolean; // [추가] 최신 메시지 여부
  sources?: string[];
  contextUsed?: string;
  onSourceClick?: (source: string, context: string) => void;
}

// 텍스트 전처리
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
  isLatest = false, // 기본값 false
  sources,
  contextUsed,
  onSourceClick,
}: MessageBubbleProps) => {
  // 1. 소스 목록 토글 상태 관리
  // 스트리밍 중이거나 최신 메시지라면 기본적으로 열어둠 (true), 아니면 닫아둠 (false)
  const [isSourceOpen, setIsSourceOpen] = useState(isStreaming || isLatest);

  // 2. 표 분리 로직
  const { cleanText, tables } = useMemo(() => {
    if (isStreaming) {
      return { cleanText: content, tables: [] };
    }
    return parseContentWithTables(content);
  }, [content, isStreaming]);

  const textToRender = preprocessContent(cleanText);

  return (
    <div
      className={`flex flex-col ${
        role === "user" ? "items-end" : "items-start"
      }`}
    >
      {/* 메시지 본문 카드 */}
      <Card
        className={`max-w-[85%] border-none p-0 ${
          role === "user"
            ? "bg-blue-500 text-white rounded-br-none shadow-md text-[0.92rem] shadow-blue-500"
            : "bg-gray-50 rounded-bl-none shadow-md text-[0.92rem] shadow-gray-300"
        }`}
      >
        <CardContent className="p-3 leading-relaxed break-all">
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
        </CardContent>
      </Card>

      {/* 분리된 표 렌더링 */}
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

      {/* 소스(근거) 영역 */}
      {role === "assistant" && sources && sources.length > 0 && (
        <div className="mt-2 max-w-[85%]">
          {/* 1. 토글 버튼 (닫혀있을 때만 보임, 혹은 항상 보여서 접기/펴기 가능하게) */}
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
              : `근거 자료 ${sources.length}개 보기`}
          </button>

          {/* 2. 실제 소스 버튼 목록 (열려있을 때만 보임) */}
          {isSourceOpen && (
            <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {sources.map((source, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    onSourceClick && onSourceClick(source, contextUsed || "")
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-700 hover:bg-gray-100 hover:border-blue-200 transition-all shadow-sm"
                >
                  <BookOpen size={12} />
                  <span className="truncate max-w-[200px]">{source}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 답변 준비 중 로딩 */}
      {isStreaming && content.length === 0 && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>답변 준비 중...</span>
        </div>
      )}
    </div>
  );
};
