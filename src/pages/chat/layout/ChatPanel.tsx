import { useRef, useEffect, useState, type DragEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowBigUpIcon, Loader2 } from "lucide-react";

import { getChatSessionDetail } from "@/services/chat.service";
import { useChatStore, type Message } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useDocumentStore } from "@/store/documentStore";
import { useDialogStore } from "@/store/dialogStore";
import { MessageBubble } from "@/utils/MessageBubble";
import { extractMetadataFromContent } from "@/utils/messageParser";

/**
 * ChatPanel 컴포넌트
 * - 채팅 세션 관리, 메시지 송수신, 문서 소스 연결 기능을 담당합니다.
 * - 메시지 증발 현상을 방지하기 위해 로컬 상태와 DB 상태 동기화 로직이 강화되었습니다.
 */
export function ChatPanel() {
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const store = useChatStore();
  const docStore = useDocumentStore();
  const dialog = useDialogStore();
  const { user } = useAuthStore();

  const currentSessionId = store.selectedSessionId;
  const isStreaming = store.isStreaming;

  const currentSession = store.sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const draftKey = currentSessionId || "new";
  const inputValue = store.drafts[draftKey] || "";

  const [isDragging, setIsDragging] = useState<boolean>(false);

  // 세션 상세 데이터 동기화 쿼리
  const { data: sessionDetail, refetch } = useQuery({
    queryKey: ["sessionDetail", currentSessionId],
    queryFn: () => getChatSessionDetail(currentSessionId!),
    enabled: !!currentSessionId,
    // [중요] 스트리밍 직후에는 즉시 refetch를 하므로 staleTime을 짧게 유지하지 않아도 되지만,
    // 일반적인 상황에서의 부하를 줄이기 위해 설정
    staleTime: 1000 * 5,
  });

  // [추가] 스트리밍이 끝나면 DB 데이터를 최신으로 갱신 요청
  useEffect(() => {
    if (!isStreaming && currentSessionId) {
      refetch();
    }
  }, [isStreaming, currentSessionId, refetch]);

  /**
   * DB 데이터와 로컬 스토어 메시지 동기화 및 메타데이터 파싱
   * - [수정] 로컬 메시지가 DB보다 많은 경우(방금 대화함) 덮어쓰기를 방지하는 로직 추가
   */
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
      // DB의 sources는 string[] 이므로 SourceInfo[] 형태로 변환 필요
      // (DB 저장 시점에는 paragraphId가 없을 수 있으므로 undefined 처리)
      let sources =
        msg.sources?.map((name) => ({
          name: name,
          paragraphId: undefined, // 과거 데이터는 ID가 없음
        })) || [];

      let contextUsed = msg.contextUsed;

      // 백엔드에 정보가 없고 봇의 메시지라면 -> 본문 파싱 시도 (하위 호환성)
      if ((!sources || sources.length === 0) && msg.role === "assistant") {
        const parsed = extractMetadataFromContent(msg.content);

        // 파싱 결과가 있다면 적용
        if (parsed.sources.length > 0) {
          sources = parsed.sources.map((name) => ({
            name,
            paragraphId: undefined,
          }));
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
        sources,
        contextUsed,
      };
    });

    // 3. 업데이트 조건 체크
    const storeMsgs = sessionInStore?.messages || [];

    // [핵심 수정] 메시지 증발 방지 로직
    // 로컬 스토어의 메시지가 DB보다 더 많다면, 아직 DB에 저장이 덜 된 상태이거나
    // 방금 대화를 마친 상태이므로 DB 데이터로 덮어쓰지 않고 기다립니다.
    if (storeMsgs.length > loadedMessages.length) {
      return;
    }

    // 개수가 다르다면 (DB가 더 많거나 같은 경우만 진입) 업데이트 대상
    const countMismatch = storeMsgs.length !== loadedMessages.length;

    // 소스 업데이트 필요 여부 체크 (개수는 같은데 메타데이터가 늦게 온 경우)
    const lastStoreBotMsg = [...storeMsgs]
      .reverse()
      .find((m) => m.role === "assistant");
    const lastLoadedBotMsg = [...loadedMessages]
      .reverse()
      .find((m) => m.role === "assistant");

    const needSourceUpdate =
      lastStoreBotMsg &&
      lastLoadedBotMsg &&
      (!lastStoreBotMsg.sources || lastStoreBotMsg.sources.length === 0) &&
      lastLoadedBotMsg.sources &&
      lastLoadedBotMsg.sources.length > 0;

    // 내용이 다르거나(DB가 더 최신), 소스 업데이트가 필요하면 덮어쓰기
    if (countMismatch || needSourceUpdate) {
      store.setMessages(currentSessionId, loadedMessages);
    }
  }, [sessionDetail, currentSessionId, isStreaming, store]);

  /**
   * 소스 클릭 핸들러 (paragraph_idx 활용)
   */
  const handleSourceClick = (
    sourceName: string,
    context: string,
    paragraphId?: number
  ) => {
    const normalize = (name: string) => name.replace(/\s+/g, "").toLowerCase();
    const cleanSourceName = normalize(
      sourceName.replace(/\.(hwp|hwpx|pdf)$/i, "")
    );

    // 문서 목록에서 찾기
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
      store.setSelectedReference({
        sourceName,
        text: context,
        paragraphId: paragraphId,
      });
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
          const isLatest = i === messages.length - 1;
          const isMsgStreaming =
            isStreaming && msg.role === "assistant" && isLatest;

          return (
            <MessageBubble
              key={i}
              role={msg.role as "user" | "assistant"}
              content={msg.content}
              isStreaming={isMsgStreaming}
              isLatest={isLatest}
              // [수정] 스토어의 sources(객체 배열)를 MessageBubble 호환을 위해 이름만 추출하여 전달
              sources={msg.sources?.map((s) => s.name) || []}
              contextUsed={msg.contextUsed}
              // [핵심] 클릭 시 해당 소스의 paragraphId를 찾아 핸들러에 전달
              onSourceClick={(name, ctx) => {
                const targetSource = msg.sources?.find((s) => s.name === name);
                handleSourceClick(name, ctx, targetSource?.paragraphId);
              }}
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
