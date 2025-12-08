import { useRef, useEffect, useState, type DragEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowBigUpIcon, Loader2, BookOpen } from "lucide-react";

// 마크다운 처리 임포트
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { getChatSessionDetail } from "@/services/chat.service";
import { useChatStore, type Message } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";

export function ChatPanel() {
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 1. Store 연결
  const store = useChatStore();
  const { user } = useAuthStore();

  const currentSessionId = store.selectedSessionId;
  const isStreaming = store.isStreaming;

  // 2. 현재 세션의 메시지 가져오기
  const currentSession = store.sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // 3. 입력창 상태 동기화
  const draftKey = currentSessionId || "new";
  const inputValue = store.drafts[draftKey] || "";

  const [isDragging, setIsDragging] = useState(false);

  // 4. 세션 상세 데이터 동기화
  const { data: sessionDetail } = useQuery({
    queryKey: ["sessionDetail", currentSessionId],
    queryFn: () => getChatSessionDetail(currentSessionId!),
    enabled: !!currentSessionId,
    staleTime: 0,
  });

  // DB에서 가져온 내용을 Store에 업데이트
  useEffect(() => {
    if (sessionDetail && currentSessionId) {
      // 스트리밍 중이 아닐 때만 동기화
      if (!isStreaming) {
        // [수정 핵심 1] 스토어에 해당 세션이 존재하는지 확인
        const sessionExists = store.sessions.some(
          (s) => s.id === currentSessionId
        );

        // [수정 핵심 2] 세션이 없으면(새로고침 직후 등), API 메타데이터로 세션 껍데기 먼저 생성
        if (!sessionExists) {
          store.createSession(
            String(sessionDetail.session.id), // ID는 문자열로 변환하여 통일
            sessionDetail.session.title
          );
        }

        // [수정 핵심 3] 메시지 변환 및 주입
        const loadedMessages: Message[] = sessionDetail.messages.map(
          (msg, idx) => ({
            // 고유 ID 생성 (React key 오류 방지)
            id: `msg-${currentSessionId}-${idx}-${Date.now()}`,
            role: (msg.role === "system" ? "assistant" : msg.role) as
              | "user"
              | "assistant",
            content: msg.content,
            createdAt: new Date().toISOString(), // DB에 시간이 없다면 현재 시간 혹은 API의 created_at 활용
          })
        );

        store.setMessages(currentSessionId, loadedMessages);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionDetail, currentSessionId, isStreaming]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const next = Math.min(200, ta.scrollHeight);
    ta.style.height = next + "px";
  }, [inputValue]);

  // 5. 메시지 전송
  const handleSend = () => {
    if (!inputValue.trim() || isStreaming || !user) return;

    store.sendMessage({
      sessionId: currentSessionId,
      content: inputValue,
      userId: user.id,
    });

    textareaRef.current?.focus();
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const handleSourceClick = (sourceName: string, context: string) => {
    store.setSelectedReference({ sourceName, text: context });
  };

  return (
    <div
      className="flex flex-col w-full h-full relative min-h-0"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-3xl border-dashed border-blue-400/70 bg-blue-100/50" />
      )}

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto overflow-w-auto min-h-0 px-4 pt-2 flex flex-col gap-10 rounded-t-2xl">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-slate-400">
            <p>ALAiN에게 궁금한 내용을 물어보세요!</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {msg.content.length > 0 && (
              <Card
                className={`max-w-[75%] border-none text-md ${
                  msg.role === "user"
                    ? "bg-blue-400 text-white rounded-br-none p-0 shadow-md "
                    : "bg-gray-100 rounded-bl-none p-0 shadow-md "
                }`}
              >
                <CardContent className="p-3 leading-relaxed break-all">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // [핵심 수정 1] 문단(p) 스타일 추가
                      // - 리스트 내부의 텍스트가 p태그로 감싸질 때 불필요한 여백을 줄이고 줄간격을 조절합니다.
                      p: ({ ...props }) => (
                        <p
                          className="mb-1 leading-relaxed last:mb-0"
                          {...props}
                        />
                      ),

                      // [핵심 수정 2] 리스트(ul, ol) 스타일 변경
                      // - list-inside 제거 -> 숫자가 글자와 분리되지 않음
                      // - pl-5 추가 -> 들여쓰기를 통해 가독성 확보
                      ul: ({ ...props }) => (
                        <ul
                          className="list-disc pl-5 mb-2 space-y-1"
                          {...props}
                        />
                      ),
                      ol: ({ ...props }) => (
                        <ol
                          className="list-decimal pl-5 mb-2 space-y-1"
                          {...props}
                        />
                      ),

                      // 리스트 아이템(li)
                      li: ({ ...props }) => <li className="pl-1" {...props} />,

                      // 제목 스타일링 (h1~h3)
                      h1: ({ ...props }) => (
                        <h1
                          className="text-lg font-bold mt-4 mb-2"
                          {...props}
                        />
                      ),
                      h2: ({ ...props }) => (
                        <h2
                          className="text-base font-bold mt-3 mb-2"
                          {...props}
                        />
                      ),
                      h3: ({ ...props }) => (
                        <h3
                          className="text-sm font-bold mt-2 mb-1"
                          {...props}
                        />
                      ),

                      // 코드 블록 스타일링
                      code: ({
                        className,
                        children,
                        ...props
                      }: React.ComponentPropsWithoutRef<"code">) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const isInline =
                          !match && !String(children).includes("\n");

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

                      // 인용문
                      blockquote: ({ ...props }) => (
                        <blockquote
                          className="border-l-4 border-gray-300 pl-4 my-2 italic text-gray-500 bg-gray-50 py-1"
                          {...props}
                        />
                      ),

                      // 테이블
                      table: ({ ...props }) => (
                        <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
                          <table
                            className="min-w-full divide-y divide-gray-300"
                            {...props}
                          />
                        </div>
                      ),
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

                      // 링크
                      a: ({ ...props }) => (
                        <a
                          className="text-blue-600 hover:underline cursor-pointer font-medium"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      ),

                      // 굵게
                      strong: ({ ...props }) => (
                        <strong
                          className="font-bold text-gray-900"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            )}

            {msg.role === "assistant" &&
              msg.sources &&
              msg.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                  {msg.sources.map((source, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        handleSourceClick(source, msg.contextUsed || "")
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-700 hover:bg-blue-100 hover:border-blue-200 transition-all"
                    >
                      <BookOpen size={12} />
                      <span className="truncate max-w-[150px]">{source}</span>
                    </button>
                  ))}
                </div>
              )}
          </div>
        ))}

        {isStreaming &&
          messages.length > 0 &&
          messages[messages.length - 1].content.length === 0 && (
            <div className="flex items-start">
              <Card className="bg-gray-100 rounded-bl-none p-0 border-none">
                <CardContent className="p-3 flex items-center gap-2 text-sm text-gray-500 break-all">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  답변 준비 중...
                </CardContent>
              </Card>
            </div>
          )}
        <div ref={chatEndRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="rounded-b-2xl p-2 flex flex-col gap-2 shrink-0"
      >
        <div className="flex items-end gap-2 rounded-2xl shadow-md shadow-blue-200 border border-blue-100 focus-within:ring-2 focus-within:ring-blue-200 bg-white">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => store.setDraft(draftKey, e.target.value)}
            placeholder="  질문을 입력하세요"
            rows={1}
            disabled={isStreaming}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 max-h-[200px] resize-none px-2 py-3 text-sm focus:outline-none scroll-auto disabled:bg-transparent"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isStreaming}
            className={`m-1 rounded-xl p-2 text-white transition-colors shrink-0 ${
              !inputValue.trim() || isStreaming
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            }`}
          >
            {isStreaming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowBigUpIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
