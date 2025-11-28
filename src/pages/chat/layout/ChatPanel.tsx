import { useRef, useState, useEffect, type DragEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowBigUpIcon, Loader2, BookOpen } from "lucide-react";

import {
  createChatSession,
  getChatSessionDetail,
  streamChatResponse,
} from "@/services/chat.service";
import { useChatStore, type Message } from "@/store/chatStore";

export function ChatPanel() {
  const queryClient = useQueryClient();
  const store = useChatStore();
  const currentSessionId = store.currentSessionId;

  const currentSession = store.sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const [input, setInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  // [추가] react-query의 isPending 대신 직접 스트리밍 상태를 관리합니다.
  const [isStreaming, setIsStreaming] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 1. 상세 대화 내용 가져오기 (사이드바 클릭 시 작동)
  const { data: sessionDetail } = useQuery({
    queryKey: ["sessionDetail", currentSessionId],
    queryFn: () => getChatSessionDetail(currentSessionId!),
    enabled: !!currentSessionId,
    staleTime: 0,
  });

  // 2. API 데이터가 오면 Store에 덮어쓰기
  useEffect(() => {
    if (sessionDetail && currentSessionId) {
      const loadedMessages: Message[] = sessionDetail.messages.map(
        (msg, idx) => ({
          id: `msg-${currentSessionId}-${idx}-${Date.now()}`,
          role: (msg.role === "system" ? "assistant" : msg.role) as
            | "user"
            | "assistant",
          content: msg.content,
          createdAt: new Date().toISOString(),
        })
      );

      if (store.sessions.some((s) => s.id === currentSessionId)) {
        store.setMessages(currentSessionId, loadedMessages);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionDetail, currentSessionId]);

  // [삭제] 기존 useMutation 로직은 스트리밍에 적합하지 않아 제거하고 send 함수 내부로 통합했습니다.

  // 스크롤 자동 이동
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming]); // isStreaming이 변할 때도 스크롤 체크

  // Textarea 높이 조절
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const next = Math.min(200, ta.scrollHeight);
    ta.style.height = next + "px";
  }, [input]);

  // 3. 메시지 전송 및 스트리밍 처리 함수
  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    let activeId = store.currentSessionId;

    // (1) 새 채팅방 생성 로직
    if (!activeId) {
      try {
        const title =
          trimmed.length > 20 ? trimmed.substring(0, 20) + "..." : trimmed;
        const newSessionId = await createChatSession({ user_id: 1, title });
        const strSessionId = String(newSessionId);

        store.createSession(strSessionId, title);
        activeId = strSessionId;

        queryClient.invalidateQueries({ queryKey: ["chatSessions"] });
      } catch (e) {
        console.error(e);
        return;
      }
    }

    // (2) 사용자 메시지 즉시 표시 (낙관적 업데이트)
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    store.addMessage(activeId, userMsg);
    setInput("");
    setIsStreaming(true); // 스트리밍 시작 상태 변경

    // (3) 봇의 '빈 메시지' 미리 생성
    const botMsgId = (Date.now() + 1).toString();
    const botMsg: Message = {
      id: botMsgId,
      role: "assistant",
      content: "", // 내용은 비워둡니다. 스트리밍으로 채워질 예정
      createdAt: new Date().toISOString(),
    };
    store.addMessage(activeId, botMsg);

    try {
      // 3. [변경] POST 방식 스트리밍 호출
      await streamChatResponse(
        {
          conversation_id: String(activeId), // 세션 ID
          message: trimmed, // 질문 내용
          user_id: 1, // 유저 ID (필수)
        },
        (token) => {
          // 글자가 들어올 때마다 화면에 찍기
          store.streamTokenToLastMessage(activeId!, token);
        }
      );
    } catch (error) {
      console.error("Streaming Error:", error);
      store.streamTokenToLastMessage(activeId!, "\n[오류가 발생했습니다]");
    } finally {
      setIsStreaming(false);
    }
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
            {/* 메시지 내용이 없더라도 스트리밍 중이면 카드 표시 */}
            {msg.content.length > 0 && (
              <Card
                className={`max-w-[75%] border-none ${
                  msg.role === "user"
                    ? "bg-blue-400 text-white rounded-br-none p-0 shadow-md "
                    : "bg-yellow-100 rounded-bl-none p-0 shadow-md "
                }`}
              >
                <CardContent className="p-2 text-sm whitespace-pre-wrap leading-relaxed break-all">
                  {/* 내용이 비어있고 어시스턴트 메시지라면 커서 깜빡임 효과 등을 줄 수 있음 */}
                  {msg.content}
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

        {/* [변경] 별도의 로딩 카드 대신, 실제 말풍선이 생성되므로 이 부분은 필요 시 제거하거나 유지 */}
        {/* 만약 답변 생성 전 '생각 중...' 단계를 표현하고 싶다면 아래 유지 */}
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
          send();
        }}
        className="rounded-b-2xl p-2 flex flex-col gap-2 shrink-0"
      >
        <div className="flex items-end gap-2 rounded-2xl shadow-md shadow-blue-200 border border-blue-100 focus-within:ring-2 focus-within:ring-blue-200 bg-white">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="  질문을 입력하세요"
            rows={1}
            disabled={isStreaming}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            className="flex-1 max-h-[200px] resize-none px-2 py-3 text-sm focus:outline-none scroll-auto disabled:bg-transparent"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className={`m-1 rounded-xl p-2 text-white transition-colors shrink-0 ${
              !input.trim() || isStreaming
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
