import { useRef, useState, useEffect, type DragEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

import { ArrowBigUpIcon, Loader2, BookOpen } from "lucide-react";

import { sendMessage } from "@/services/chat.service";
import { useChatStore, type Message } from "@/store/chatStore";

export function ChatPanel() {
  // 1. Store 연결
  const store = useChatStore();

  // 현재 세션이 없으면 undefined, 있으면 해당 세션 객체
  const currentSession = store.sessions.find(
    (s) => s.id === store.currentSessionId
  );
  const messages = currentSession?.messages || [];

  // 상태 관리
  const [input, setInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // API Mutation
  const chatMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (data, variables) => {
      // 요청 보낼 때 썼던 ID를 그대로 사용
      const targetId = variables.conversation_id;

      const botMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.answer,
        createdAt: new Date().toISOString(),
        sources: data.sources,
        contextUsed: data.context_used,
      };
      store.addMessage(targetId, botMsg);
    },
    onError: (error, variables) => {
      console.error(error);
      const targetId = variables.conversation_id;
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "오류가 발생했습니다.",
        createdAt: new Date().toISOString(),
      };
      store.addMessage(targetId, errorMsg);
    },
  });

  // 스크롤 자동 이동
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, chatMutation.isPending]);

  // 높이 조절
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const next = Math.min(200, ta.scrollHeight);
    ta.style.height = next + "px";
  }, [input]);

  // 전송 로직 단순화 및 강화
  const send = () => {
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;

    // 1. ID 확보: 현재 ID가 있으면 쓰고, 없으면 새로 만듦 (변수에 저장)
    let activeId = store.currentSessionId;
    let isNew = false;

    if (!activeId) {
      activeId = store.createSession(); // createSession이 ID를 리턴해야 함
      isNew = true;
    }

    // 2. 사용자 메시지 저장 (확보한 ID 사용)
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    store.addMessage(activeId, userMsg);

    // 3. 첫 대화면 제목 변경
    if (isNew) {
      const title =
        trimmed.length > 20 ? trimmed.substring(0, 20) + "..." : trimmed;
      store.updateSessionTitle(activeId, title);
    }

    setInput("");

    // 4. 서버 전송
    chatMutation.mutate({
      conversation_id: activeId,
      message: trimmed,
    });
  };

  // 드래그 이벤트
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
      className="flex flex-col w-full h-[94vh]  rounded-xl relative min-h-0"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-3xl border-dashed border-blue-400/70 bg-blue-100/50" />
      )}

      {/* [수정 3] 메시지 영역 레이아웃 (Top-Down Stacking) */}
      <div className="flex-1 overflow-y-auto overflow-w-auto min-h-0 px-4 pt-2 flex flex-col gap-2 rounded-t-2xl">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-slate-400">
            <p>새로운 대화를 시작해보세요!</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <Card
              className={`max-w-[75%] border-none ${
                msg.role === "user"
                  ? "bg-blue-400 text-white rounded-br-none p-0"
                  : "bg-yellow-100 rounded-bl-none p-0"
              }`}
            >
              <CardContent className="p-2 text-sm whitespace-pre-wrap leading-relaxed break-all">
                {msg.content}
              </CardContent>
            </Card>

            {/* 출처 표시 */}
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

        {/* 로딩 표시 */}
        {chatMutation.isPending && (
          <div className="flex items-start">
            <Card className="bg-gray-100 rounded-bl-none p-0 border-none">
              <CardContent className="p-3 flex items-center gap-2 text-sm text-gray-500 break-all">
                <Loader2 className="w-4 h-4 animate-spin" />
                답변 생성 중...
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 입력 컴포저 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="rounded-b-2xl p-2 flex flex-col gap-2 shrink-0"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-blue-100 focus-within:ring-2 focus-within:ring-blue-200 bg-white">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ALAiN에게 물어보기"
            rows={1}
            disabled={chatMutation.isPending}
            className="flex-1 max-h-[200px] resize-none px-2 py-3 text-sm focus:outline-none scroll-auto disabled:bg-transparent"
          />

          <button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
            className={`m-1 rounded-xl p-2 text-white transition-colors shrink-0 ${
              !input.trim() || chatMutation.isPending
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            }`}
          >
            {chatMutation.isPending ? (
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
