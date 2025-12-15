import { useRef, useEffect, useState, type DragEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowBigUpIcon, Loader2 } from "lucide-react";

import { getChatSessionDetail } from "@/services/chat.service";
import { useChatStore, type Message } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useDocumentStore } from "@/store/documentStore"; // [추가] 문서를 찾기 위해 필요
import { useDialogStore } from "@/store/dialogStore"; // [추가] 알림용
import { MessageBubble } from "@/utils/MessageBubble";

// MessageBubble 컴포넌트 임포트

export function ChatPanel() {
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const store = useChatStore();
  const docStore = useDocumentStore(); // [추가] 문서 스토어 연결
  const dialog = useDialogStore();
  const { user } = useAuthStore();

  const currentSessionId = store.selectedSessionId;
  const isStreaming = store.isStreaming;

  const currentSession = store.sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const draftKey = currentSessionId || "new";
  const inputValue = store.drafts[draftKey] || "";

  const [isDragging, setIsDragging] = useState(false);

  // 1. 세션 상세 데이터 동기화
  const { data: sessionDetail } = useQuery({
    queryKey: ["sessionDetail", currentSessionId],
    queryFn: () => getChatSessionDetail(currentSessionId!),
    enabled: !!currentSessionId,
    staleTime: 1000 * 5,
  });

  // DB 데이터 동기화 로직 (기존 유지)
  useEffect(() => {
    if (!sessionDetail || !currentSessionId || isStreaming) return;

    const sessionInStore = store.sessions.find(
      (s) => s.id === currentSessionId
    );
    const storeMsgCount = sessionInStore?.messages.length || 0;
    const dbMsgCount = sessionDetail.messages.length;

    if (storeMsgCount > dbMsgCount) return;

    if (!sessionInStore) {
      store.createSession(
        String(sessionDetail.session.id),
        sessionDetail.session.title
      );
    }

    const loadedMessages: Message[] = sessionDetail.messages.map(
      (msg, idx) => ({
        id: `msg-${currentSessionId}-${idx}`,
        role: (msg.role === "system" ? "assistant" : msg.role) as
          | "user"
          | "assistant",
        content: msg.content,
        createdAt: new Date().toISOString(),
        // [중요] 소스 및 컨텍스트 정보 매핑 확인
        sources: msg.sources,
        contextUsed: msg.contextUsed,
      })
    );

    const lastStoreMsg =
      sessionInStore?.messages[sessionInStore.messages.length - 1];
    const lastDbMsg = loadedMessages[loadedMessages.length - 1];

    if (
      storeMsgCount !== dbMsgCount ||
      lastStoreMsg?.content !== lastDbMsg?.content
    ) {
      store.setMessages(currentSessionId, loadedMessages);
    }
  }, [sessionDetail, currentSessionId, isStreaming, store]);

  // 스크롤 및 입력창 높이 조절
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

  // 2. [핵심] 소스 클릭 핸들러 (문서 열기 + 하이라이트)
  const handleSourceClick = (sourceName: string, context: string) => {
    // 1. 전체 문서 목록에서 파일명이 일치하는 문서 검색
    // (docStore.documents가 로드되어 있어야 함. 보통 DocList에서 로드됨)
    const targetDoc = docStore.documents.find(
      (d) => d.originalFilename === sourceName
    );

    if (targetDoc) {
      // 2. 문서 뷰어 열기
      store.openDocument(targetDoc);
      // 3. 하이라이팅을 위한 참조 텍스트 설정
      store.setSelectedReference({ sourceName, text: context });
    } else {
      // 문서를 못 찾은 경우 (삭제되었거나 권한 없음)
      dialog.alert({
        title: "문서 열기 실패",
        message: `원본 문서(${sourceName})를 찾을 수 없습니다.\n삭제되었거나 접근 권한이 없을 수 있습니다.`,
        variant: "warning",
      });
    }
  };

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

  return (
    <div
      className="flex flex-col w-full h-full relative min-h-0"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-3xl border-dashed border-blue-400/70 bg-blue-100/50" />
      )}

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto overflow-w-auto min-h-0 px-4 pt-2 flex flex-col gap-10 rounded-t-2xl">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-slate-400">
            <p>ALAiN에게 궁금한 내용을 물어보세요!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMsgStreaming =
            isStreaming &&
            msg.role === "assistant" &&
            i === messages.length - 1;

          return (
            <MessageBubble
              key={i}
              role={msg.role as "user" | "assistant"}
              content={msg.content}
              isStreaming={isMsgStreaming}
              sources={msg.sources}
              contextUsed={msg.contextUsed}
              onSourceClick={handleSourceClick} // [연결] 핸들러 전달
            />
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* 입력 폼 */}
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
