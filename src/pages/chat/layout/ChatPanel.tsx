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
import { extractMetadataFromContent } from "@/utils/messageParser";
import type { Document, DocumentStatus } from "@/types/UserType";
import { MessageBubble, type SourceItem } from "@/utils/MessageBubble";

// [수정 포인트] 백엔드 소스 참조 데이터 타입 정의 (Any 제거)
interface BackendSourceRef {
  doc_id: number;
  paragraph_idx: number;
  chunk_id: number; // 무시할 값이지만 타입 정의에는 포함
  doc_name?: string;
  original_filename?: string;
  name?: string;
}

// [수정 포인트] 백엔드 메시지 타입 정의
interface BackendMessage {
  role: string;
  content: string;
  source_refs?: BackendSourceRef[];
  sources?: BackendSourceRef[]; // 구버전 호환
  contextUsed?: string;
}

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

  const { data: sessionDetail, refetch } = useQuery({
    queryKey: ["sessionDetail", currentSessionId],
    queryFn: () => getChatSessionDetail(currentSessionId!),
    enabled: !!currentSessionId,
    staleTime: 1000 * 5,
  });

  useEffect(() => {
    if (!isStreaming && currentSessionId) {
      refetch();
    }
  }, [isStreaming, currentSessionId, refetch]);

  /**
   * DB 데이터 동기화 로직
   */
  useEffect(() => {
    if (!sessionDetail || !currentSessionId || isStreaming) return;

    const sessionInStore = store.sessions.find(
      (s) => s.id === currentSessionId
    );

    const dbMessages = sessionDetail.messages as unknown as BackendMessage[];

    if (!sessionInStore) {
      store.createSession(
        String(sessionDetail.session.id),
        sessionDetail.session.title
      );
    }

    const loadedMessages: Message[] = dbMessages.map((msg, idx) => {
      // [수정 포인트] 소스 매핑 로직 강화 및 타입 안전성 확보
      const rawRefs = msg.source_refs || msg.sources || [];

      let sources: SourceItem[] = rawRefs.map((ref) => {
        // [수정] 근거목록에 문서 이름과 문단 번호를 명시적으로 표시
        const baseName =
          ref.doc_name ||
          ref.original_filename ||
          ref.name ||
          `문서 ${ref.doc_id}`;

        // 화면 표시용 이름에 (문단 123) 형태 추가
        const displayName = `${baseName}${
          ref.paragraph_idx !== undefined ? ` (문단 ${ref.paragraph_idx})` : ""
        }`;

        return {
          name: displayName,
          // ID 매핑: 명확하게 number 타입 할당
          docId: ref.doc_id,
          paragraphId: ref.paragraph_idx,
        };
      });

      let contextUsed = msg.contextUsed;

      // 소스가 비어있고 봇 메시지라면 텍스트 파싱 시도 (레거시 데이터 대응)
      if (sources.length === 0 && msg.role === "assistant") {
        const parsed = extractMetadataFromContent(msg.content);
        if (parsed.sources.length > 0) {
          sources = parsed.sources.map((name) => ({
            name,
            docId: undefined,
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

    const storeMsgs = sessionInStore?.messages || [];

    // 로컬 메시지가 더 최신이면(개수가 많으면) 대기
    if (storeMsgs.length > loadedMessages.length) {
      return;
    }

    // 변경사항 감지 및 업데이트
    const countMismatch = storeMsgs.length !== loadedMessages.length;

    const lastStoreBotMsg = [...storeMsgs]
      .reverse()
      .find((m) => m.role === "assistant");
    const lastLoadedBotMsg = [...loadedMessages]
      .reverse()
      .find((m) => m.role === "assistant");

    // 로컬의 마지막 봇 메시지에 소스가 없는데, 로드된 메시지에는 소스가 있다면 업데이트 필요
    const needSourceUpdate =
      lastStoreBotMsg &&
      lastLoadedBotMsg &&
      (!lastStoreBotMsg.sources || lastStoreBotMsg.sources.length === 0) &&
      lastLoadedBotMsg.sources &&
      lastLoadedBotMsg.sources.length > 0;

    if (countMismatch || needSourceUpdate) {
      store.setMessages(currentSessionId, loadedMessages);
    }
  }, [sessionDetail, currentSessionId, isStreaming, store]);

  /**
   * 소스 클릭 핸들러 (API 직접 조회 로직 강화)
   */
  const handleSourceClick = async (sourceItem: SourceItem, context: string) => {
    // [수정] 클릭된 버튼의 데이터 로그 출력
    console.log("🖱️ [Click] Source Button Data:", {
      name: sourceItem.name,
      docId: sourceItem.docId,
      paragraphId: sourceItem.paragraphId,
      contextPreview: context.slice(0, 30) + "...",
    });

    const { name, docId, paragraphId } = sourceItem;

    // 문서 이름 정규화 (확장자 제거 및 공백 제거)
    // 표시용 이름에 붙은 (문단 123) 제거 후 파일명만 추출 시도
    const rawName = name.replace(/\s*\(문단\s*\d+\)$/, "");
    const normalize = (n: string) => n.replace(/\s+/g, "").toLowerCase();
    const cleanSourceName = normalize(
      rawName.replace(/\.(hwp|hwpx|pdf)$/i, "")
    );

    // 1. [로컬 검색] DocStore에 이미 로드된 문서 목록에서 찾기
    let targetDoc: Document | undefined = undefined;

    if (docId) {
      targetDoc = docStore.documents.find((d) => d.id === docId);
    }

    // ID로 못 찾았으면 이름으로 검색 (차선책)
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

    // 2. [API 조회] 로컬에 없고 ID는 있는 경우 직접 fetch
    if (!targetDoc && docId) {
      try {
        const docDetailResponse = await fetchDocumentContent(docId);

        // [수정 포인트] BackendDocument 타입으로 캐스팅하여 Document 객체 생성 (Any 제거)
        const rawData = docDetailResponse as unknown as BackendDocument;

        targetDoc = {
          id: docDetailResponse.id,
          userId: rawData.user_id || 0,
          departmentId: rawData.dept_id || 0,
          projectId: rawData.project_id || 0,
          title: docDetailResponse.original_filename,
          content: docDetailResponse.content || "",
          originalFilename: docDetailResponse.original_filename,
          storedPath: rawData.stored_path || "",
          fileExt: rawData.file_ext
            ? rawData.file_ext.replace(".", "")
            : "unknown",
          fileSize: rawData.file_size || 0,
          category: "GENERAL",
          status: (rawData.status as DocumentStatus) || "COMPLETED",
          version: rawData.version || "1.0",
          createdAt: rawData.created_at || new Date().toISOString(),
          updatedAt: rawData.updated_at || new Date().toISOString(),
        };

        // React Query 캐시 수동 업데이트 (DocViewer에서 사용됨)
        queryClient.setQueryData(["docContent", docId], docDetailResponse);
      } catch (error) {
        console.error("문서 직접 조회 실패:", error);
      }
    }

    // 3. [문서 열기]
    if (targetDoc) {
      store.openDocument(targetDoc);

      // [수정 포인트] paragraphId가 0인 경우도 유효하므로 null/undefined 체크만 수행
      if (paragraphId !== undefined && paragraphId !== null) {
        store.setSelectedReference({
          sourceName: name, // 원본 이름 사용
          text: context,
          paragraphId: paragraphId,
        });
      } else {
        // ID가 없으면 텍스트 컨텍스트만 전달
        store.setSelectedReference({
          sourceName: name,
          text: context,
        });
      }
    } else {
      dialog.alert({
        title: "문서 열기 실패",
        message: `원본 문서(${rawName})를 찾을 수 없습니다.\n삭제되었거나 권한이 없습니다.`,
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
              sources={msg.sources}
              contextUsed={msg.contextUsed}
              onSourceClick={(sourceItem, ctx) => {
                handleSourceClick(sourceItem, ctx);
              }}
            />
          );
        })}
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
