import { useRef, useEffect, useState, type DragEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowBigUpIcon, Loader2 } from "lucide-react";

import { getChatSessionDetail } from "@/services/chat.service";
import {
  fetchDocumentContent,
  type BackendDocument,
} from "@/services/documents.service";
import { useChatStore, type Message } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useDocumentStore } from "@/store/documentStore";
import { useDialogStore } from "@/store/dialogStore";
import { MessageBubble } from "@/utils/MessageBubble";
import { extractMetadataFromContent } from "@/utils/messageParser";
import type { Document, DocumentStatus } from "@/types/UserType";

/**
 * ChatPanel 컴포넌트
 * - 채팅 세션 관리, 메시지 송수신, 문서 소스 연결 기능을 담당합니다.
 * - 소스 클릭 시 [로컬 리스트 -> API 조회 -> 에러]의 3단계 폴백 로직을 수행합니다.
 */
export function ChatPanel() {
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const store = useChatStore();
  const docStore = useDocumentStore();
  const dialog = useDialogStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

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
    staleTime: 1000 * 5,
  });

  // 스트리밍이 끝나면 DB 데이터를 최신으로 갱신 요청 (메시지 누락 방지)
  useEffect(() => {
    if (!isStreaming && currentSessionId) {
      refetch();
    }
  }, [isStreaming, currentSessionId, refetch]);

  /**
   * DB 데이터와 로컬 스토어 메시지 동기화 및 메타데이터 파싱
   */
  useEffect(() => {
    if (!sessionDetail || !currentSessionId || isStreaming) return;

    const sessionInStore = store.sessions.find(
      (s) => s.id === currentSessionId
    );

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
      // 2-1. 소스 정보 초기화
      // DB의 sources는 string[] 이거나, 메타데이터가 포함된 구조일 수 있음
      // 여기서는 string[]이라고 가정하고 객체로 변환 (docId는 아직 없음)
      let sources =
        msg.sources?.map((name) => ({
          name: name,
          paragraphId: undefined,
          docId: undefined,
        })) || [];

      let contextUsed = msg.contextUsed;

      // 2-2. 백엔드에 정보가 없고 봇의 메시지라면 -> 본문 파싱 시도 (구버전 데이터 호환)
      if ((!sources || sources.length === 0) && msg.role === "assistant") {
        const parsed = extractMetadataFromContent(msg.content);

        if (parsed.sources.length > 0) {
          // [수정] docId 속성을 명시적으로 추가하여 타입 불일치 오류 해결
          sources = parsed.sources.map((name) => ({
            name,
            paragraphId: undefined,
            docId: undefined,
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

    // 3. 업데이트 조건 체크 (메시지 증발 방지 로직 포함)
    const storeMsgs = sessionInStore?.messages || [];

    // 로컬 스토어의 메시지가 더 많다면(방금 대화함), 아직 DB 갱신 전이므로 덮어쓰지 않음
    if (storeMsgs.length > loadedMessages.length) {
      return;
    }

    const countMismatch = storeMsgs.length !== loadedMessages.length;

    // 마지막 봇 메시지의 소스 정보가 스토어엔 없는데 DB엔 있는지 체크
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

    // 개수가 다르거나 소스 업데이트가 필요하면 덮어쓰기
    if (countMismatch || needSourceUpdate) {
      store.setMessages(currentSessionId, loadedMessages);
    }
  }, [sessionDetail, currentSessionId, isStreaming, store]);

  /**
   * 소스 클릭 핸들러 (3단계 폴백 로직 적용)
   * 1. 로컬 문서 리스트 확인
   * 2. API 상세 조회 (로컬에 없고 docId 있을 시)
   * 3. 실패 시 에러 팝업
   */
  const handleSourceClick = async (
    sourceName: string,
    context: string,
    paragraphId?: number,
    docId?: number
  ) => {
    const normalize = (name: string) => name.replace(/\s+/g, "").toLowerCase();
    const cleanSourceName = normalize(
      sourceName.replace(/\.(hwp|hwpx|pdf)$/i, "")
    );

    // 1. [로컬 검색] 문서 목록에서 찾기 (ID 우선, 그 다음 이름)
    let targetDoc: Document | undefined = undefined;

    if (docId) {
      targetDoc = docStore.documents.find((d) => d.id === docId);
    }

    if (!targetDoc) {
      targetDoc = docStore.documents.find((d) => {
        const dbFileName = normalize(
          d.originalFilename.replace(/\.(hwp|hwpx|pdf)$/i, "")
        );
        return (
          dbFileName.includes(cleanSourceName) ||
          cleanSourceName.includes(dbFileName)
        );
      });
    }

    // 2. [API 조회] 로컬에 없고 docId는 있는 경우 -> 서버에서 직접 조회
    if (!targetDoc && docId) {
      try {
        const docDetailResponse = await fetchDocumentContent(docId);

        // [수정] 타입 단언을 통해 BackendDocument 필드에 안전하게 접근
        // (fetchDocumentContent는 DocumentDetailResponse를 반환하지만,
        //  실제로는 BackendDocument의 필드들을 포함하고 있다고 가정)
        const rawData = docDetailResponse as unknown as BackendDocument & {
          content?: string;
        };

        targetDoc = {
          id: rawData.id,
          userId: rawData.user_id,
          departmentId: rawData.dept_id,
          projectId: rawData.project_id,
          title: rawData.original_filename,
          // content가 비어있다면 뷰어에서 다시 로드하므로 빈 문자열 처리
          content: rawData.content || "",
          originalFilename: rawData.original_filename,
          storedPath: rawData.stored_path,
          fileExt: rawData.file_ext
            ? rawData.file_ext.replace(".", "")
            : "unknown",
          fileSize: rawData.file_size || 0,
          category: "GENERAL",
          status: (rawData.status as DocumentStatus) || "COMPLETED",
          version: rawData.version || "1.0",
          createdAt: rawData.created_at,
          updatedAt: rawData.updated_at,
        };

        // 뷰어 오픈 시 재요청 방지를 위해 캐시 프리로딩 (선택 사항)
        queryClient.setQueryData(["docContent", docId], docDetailResponse);
      } catch (error) {
        console.error("문서 직접 조회 실패:", error);
        // 여기서 에러가 나면 targetDoc은 undefined 상태 유지 -> 3단계 에러 팝업으로 이동
      }
    }

    // 3. [결과 처리]
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
        message: `원본 문서(${sourceName})를 찾을 수 없습니다.\n삭제되었거나 권한이 없는 파일일 수 있습니다.`,
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
              // MessageBubble 호환을 위해 소스 이름 배열 전달
              sources={msg.sources?.map((s) => s.name) || []}
              contextUsed={msg.contextUsed}
              // [핵심] 클릭 핸들러에 docId, paragraphId를 포함하여 전달
              onSourceClick={(name, ctx) => {
                const targetSource = msg.sources?.find((s) => s.name === name);
                handleSourceClick(
                  name,
                  ctx,
                  targetSource?.paragraphId,
                  targetSource?.docId
                );
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
