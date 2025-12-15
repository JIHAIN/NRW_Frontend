import { useRef, useEffect, useState, type DragEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowBigUpIcon, Loader2 } from "lucide-react";

import { getChatSessionDetail } from "@/services/chat.service";
import { useChatStore, type Message } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useDocumentStore } from "@/store/documentStore"; // [추가] 문서를 찾기 위해 필요
import { useDialogStore } from "@/store/dialogStore"; // [추가] 알림용
import { MessageBubble } from "@/utils/MessageBubble";
import { extractMetadataFromContent } from "@/utils/messageParser";

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

    // DB에서 가져온 메시지들
    const dbMessages = sessionDetail.messages;

    // 1. 스토어에 세션 없으면 생성
    if (!sessionInStore) {
      store.createSession(
        String(sessionDetail.session.id),
        sessionDetail.session.title
      );
    }

    // 2. 메시지 파싱 및 변환
    const loadedMessages: Message[] = dbMessages.map((msg, idx) => {
      // 2-1. 소스/근거 데이터 확보
      let sources = msg.sources;
      let contextUsed = msg.contextUsed;

      // 백엔드에 정보가 없고(과거 데이터) + 봇의 메시지라면 -> 본문 파싱 시도
      if ((!sources || sources.length === 0) && msg.role === "assistant") {
        const parsed = extractMetadataFromContent(msg.content);

        // 파싱 결과가 있다면 적용
        if (parsed.sources.length > 0) {
          sources = parsed.sources;
          contextUsed = parsed.contextUsed;
        }
      }

      return {
        id: `msg-${currentSessionId}-${idx}`,
        role: (msg.role === "system" ? "assistant" : msg.role) as
          | "user"
          | "assistant",
        content: msg.content,
        createdAt: new Date().toISOString(),
        sources, // 파싱된 소스
        contextUsed, // 파싱된 근거
      };
    });

    // 3. 업데이트 조건 체크 (여기가 문제였음)
    const storeMsgs = sessionInStore?.messages || [];

    // 개수가 다르거나
    const countMismatch = storeMsgs.length !== loadedMessages.length;

    // 개수는 같은데, 스토어의 마지막 봇 메시지에 소스가 없지만 파싱된 것엔 소스가 있는 경우 (캐시 갱신 필요)
    const lastStoreBotMsg = [...storeMsgs]
      .reverse()
      .find((m) => m.role === "assistant");
    const lastLoadedBotMsg = [...loadedMessages]
      .reverse()
      .find((m) => m.role === "assistant");

    const needSourceUpdate =
      lastStoreBotMsg &&
      lastLoadedBotMsg &&
      (!lastStoreBotMsg.sources || lastStoreBotMsg.sources.length === 0) && // 스토어엔 없고
      lastLoadedBotMsg.sources &&
      lastLoadedBotMsg.sources.length > 0; // 파싱된거엔 있을 때

    // 내용이 다르거나, 소스 업데이트가 필요하면 덮어쓰기
    if (countMismatch || needSourceUpdate) {
      // console.log("메시지 동기화 및 소스 파싱 업데이트 실행");
      store.setMessages(currentSessionId, loadedMessages);
    }
  }, [sessionDetail, currentSessionId, isStreaming, store]);

  // ========================================================================
  // [수정 2] 소스 클릭 핸들러 개선 (확장자 무시 매칭)
  // ========================================================================
  const handleSourceClick = (sourceName: string, context: string) => {
    // LLM이 말하는 파일명에서 확장자를 제거하거나 정규화
    // 예: "주차장관리지침(2023년도 4월 개정)" vs "주차장관리지침(2023년도 4월 개정).hwpx"

    const normalize = (name: string) => name.replace(/\s+/g, "").toLowerCase();
    const cleanSourceName = normalize(
      sourceName.replace(/\.(hwp|hwpx|pdf)$/i, "")
    );

    // 문서 목록에서 찾기 (포함 여부로 검색)
    const targetDoc = docStore.documents.find((d) => {
      const dbFileName = normalize(
        d.originalFilename.replace(/\.(hwp|hwpx|pdf)$/i, "")
      );
      return (
        dbFileName.includes(cleanSourceName) ||
        cleanSourceName.includes(dbFileName)
      );
    });

    if (targetDoc) {
      store.openDocument(targetDoc);
      store.setSelectedReference({ sourceName, text: context });
    } else {
      dialog.alert({
        title: "문서 열기 실패",
        message: `원본 문서(${sourceName})를 찾을 수 없습니다.\n삭제되었거나 파일명이 변경되었을 수 있습니다.`,
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
          // 이 메시지가 전체 목록의 마지막인지 체크
          const isLatest = i === messages.length - 1;

          // 스트리밍 중인가? (마지막 메시지이면서 스트리밍 상태일 때)
          const isMsgStreaming =
            isStreaming && msg.role === "assistant" && isLatest;

          return (
            <MessageBubble
              key={i}
              role={msg.role as "user" | "assistant"}
              content={msg.content}
              isStreaming={isMsgStreaming}
              // 최신 메시지 여부 전달 (true면 근거 자동 펼침, false면 접힘)
              isLatest={isLatest}
              sources={msg.sources}
              contextUsed={msg.contextUsed}
              onSourceClick={handleSourceClick}
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
