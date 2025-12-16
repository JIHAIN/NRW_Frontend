// src/store/chatStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Document } from "@/types/UserType";
import {
  createChatSession,
  streamChatResponse,
  type ChatMetadata,
} from "@/services/chat.service";

// ----------------------------------------------------------------------
// 타입 정의
// ----------------------------------------------------------------------

// [수정] 소스 정보 상세 타입 (파일명, 문단 ID, 문서 ID)
export interface SourceInfo {
  name: string;
  paragraphId?: number; // 하이라이팅을 위한 문단 ID
  docId?: number; // [추가] 문서 상세 조회를 위한 문서 ID
}

// 채팅 메시지 구조체
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  // 기존 string[]에서 SourceInfo[]로 변경하여 문단 ID 및 문서 ID 정보를 포함
  sources?: SourceInfo[];
  contextUsed?: string;
}

// 채팅 세션(대화방) 구조체
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

// 스토어 상태 및 액션 정의
interface ChatState {
  // 1. 데이터 상태 (State)
  sessions: ChatSession[]; // 전체 채팅 세션 목록
  selectedSessionId: string | null; // 현재 활성화된 세션 ID
  pinnedSessionIds: string[]; // 상단 고정된 세션 ID 목록

  drafts: Record<string, string>; // 세션별 입력창에 작성 중인 텍스트 임시 저장
  isStreaming: boolean; // 현재 답변을 생성(스트리밍) 중인지 여부

  selectedReference: {
    sourceName: string;
    text: string;
    paragraphId?: number;
  } | null;
  viewMode: "list" | "viewer"; // 좌측 패널 뷰 모드
  selectedDocument: Document | null; // 현재 보고 있는 문서 객체

  // 2. 액션 (Actions)

  // 세션 관리
  createSession: (id: string, title: string) => void;
  setSelectedSessionId: (sessionId: string | null) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  toggleSessionPin: (sessionId: string) => void;

  // 메시지 및 입력 관리
  setDraft: (sessionId: string, text: string) => void;
  addMessage: (sessionId: string, message: Message) => void;
  setMessages: (sessionId: string, messages: Message[]) => void;

  // 핵심: 메시지 전송 및 스트리밍 처리
  sendMessage: (props: {
    sessionId: string | null;
    content: string;
    userId: number;
  }) => Promise<void>;

  // UI 상호작용
  setSelectedReference: (
    data: { sourceName: string; text: string; paragraphId?: number } | null
  ) => void;
  setViewMode: (mode: "list" | "viewer") => void;
  openDocument: (doc: Document) => void;
  closeDocument: () => void;

  // 전체 초기화
  resetAll: () => void;
}

// ----------------------------------------------------------------------
// Store 구현
// ----------------------------------------------------------------------

export const useChatStore = create(
  persist<ChatState>(
    (set, get) => ({
      // 초기 상태 값
      sessions: [],
      selectedSessionId: null,
      pinnedSessionIds: [],
      drafts: {},
      isStreaming: false,
      selectedReference: null,
      viewMode: "list",
      selectedDocument: null,

      // ----------------------------------------------------------
      // 액션 구현
      // ----------------------------------------------------------

      createSession: (id, title) => {
        set((state) => {
          if (state.sessions.some((s) => s.id === id)) {
            return state;
          }

          const newSession: ChatSession = {
            id,
            title,
            messages: [],
            createdAt: new Date().toISOString(),
          };

          return {
            sessions: [newSession, ...state.sessions],
            selectedSessionId: id,
            drafts: { ...state.drafts, [id]: "" },
          };
        });
      },

      toggleSessionPin: (sessionId) =>
        set((state) => {
          const isPinned = state.pinnedSessionIds.includes(sessionId);
          return {
            pinnedSessionIds: isPinned
              ? state.pinnedSessionIds.filter((id) => id !== sessionId)
              : [...state.pinnedSessionIds, sessionId],
          };
        }),

      setSelectedSessionId: (sessionId) =>
        set({ selectedSessionId: sessionId }),

      setDraft: (sessionId, text) =>
        set((state) => ({
          drafts: { ...state.drafts, [sessionId]: text },
        })),

      addMessage: (sessionId, message) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, messages: [...s.messages, message] }
              : s
          ),
        })),

      setMessages: (sessionId, messages) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, messages } : s
          ),
        })),

      updateSessionTitle: (sessionId, title) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, title } : s
          ),
        })),

      deleteSession: (sessionId) =>
        set((state) => {
          const newDrafts = { ...state.drafts };
          delete newDrafts[sessionId];
          return {
            sessions: state.sessions.filter((s) => s.id !== sessionId),
            pinnedSessionIds: state.pinnedSessionIds.filter(
              (id) => id !== sessionId
            ),
            drafts: newDrafts,
            selectedSessionId:
              state.selectedSessionId === sessionId
                ? null
                : state.selectedSessionId,
          };
        }),

      // [핵심 기능] 메시지 전송 및 스트리밍 응답 처리
      sendMessage: async ({ sessionId, content, userId }) => {
        const store = get();

        if (store.isStreaming || !content.trim()) return;

        let activeId = sessionId;
        const trimmed = content.trim();

        // 1. 세션 ID가 없으면 서버에 세션 생성 요청
        if (!activeId) {
          try {
            const title =
              trimmed.length > 20 ? trimmed.substring(0, 20) + "..." : trimmed;

            const newSessionId = await createChatSession({
              user_id: userId,
              title,
            });
            activeId = String(newSessionId);

            store.createSession(activeId, title);
          } catch (e) {
            console.error("세션 생성 실패:", e);
            return;
          }
        }

        // 2. UI 상태 업데이트
        set((state) => {
          const newDrafts = { ...state.drafts };
          if (activeId) delete newDrafts[activeId];
          return {
            isStreaming: true,
            drafts: newDrafts,
            selectedSessionId: activeId,
          };
        });

        // 3. 사용자 메시지 추가
        const userMsg: Message = {
          id: `u-${Date.now()}`,
          role: "user",
          content: trimmed,
          createdAt: new Date().toISOString(),
        };
        get().addMessage(activeId, userMsg);

        // 4. 봇 응답 메시지 공간 추가
        const botMsgId = `b-${Date.now()}`;
        const botMsg: Message = {
          id: botMsgId,
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
          sources: [], // 초기 소스 빈 배열
        };
        get().addMessage(activeId, botMsg);

        // 5. 스트리밍 API 호출
        try {
          await streamChatResponse(
            {
              conversation_id: activeId,
              message: trimmed,
              user_id: userId,
            },
            // (1) 텍스트 델타 콜백
            (token) => {
              set((state) => ({
                sessions: state.sessions.map((session) => {
                  if (session.id === activeId) {
                    const msgs = [...session.messages];
                    const lastIdx = msgs.length - 1;
                    if (lastIdx >= 0) {
                      msgs[lastIdx] = {
                        ...msgs[lastIdx],
                        content: msgs[lastIdx].content + token,
                      };
                      return { ...session, messages: msgs };
                    }
                  }
                  return session;
                }),
              }));
            },
            // (2) 메타데이터 콜백: paragraph_idx 및 doc_id 포함하여 소스 저장
            (metadata: ChatMetadata) => {
              set((state) => ({
                sessions: state.sessions.map((session) => {
                  if (session.id === activeId) {
                    const msgs = [...session.messages];
                    const lastIdx = msgs.length - 1;

                    if (lastIdx >= 0) {
                      // [수정] doc_name, paragraph_idx, doc_id 모두 저장
                      const sourceInfos: SourceInfo[] =
                        metadata.sources?.map((s) => ({
                          name: s.doc_name,
                          paragraphId: s.paragraph_idx,
                          docId: s.doc_id, // [추가] doc_id 저장
                        })) || [];

                      msgs[lastIdx] = {
                        ...msgs[lastIdx],
                        sources: sourceInfos,
                        contextUsed: metadata.context_used || "",
                      };
                      return { ...session, messages: msgs };
                    }
                  }
                  return session;
                }),
              }));
            }
          );
        } catch (error) {
          console.error("Streaming error in Store:", error);
          set((state) => ({
            sessions: state.sessions.map((session) => {
              if (session.id === activeId) {
                const msgs = [...session.messages];
                const lastIdx = msgs.length - 1;
                if (lastIdx >= 0) {
                  msgs[lastIdx] = {
                    ...msgs[lastIdx],
                    content:
                      msgs[lastIdx].content +
                      "\n\n[오류가 발생했습니다. 잠시 후 다시 시도해주세요.]",
                  };
                  return { ...session, messages: msgs };
                }
              }
              return session;
            }),
          }));
        } finally {
          set({ isStreaming: false });
        }
      },

      setSelectedReference: (data) => set({ selectedReference: data }),
      setViewMode: (mode) => set({ viewMode: mode }),

      openDocument: (doc) =>
        set({
          selectedDocument: doc,
          viewMode: "viewer",
          selectedReference: null,
        }),

      closeDocument: () =>
        set({
          selectedDocument: null,
          viewMode: "list",
        }),

      resetAll: () =>
        set({
          sessions: [],
          selectedSessionId: null,
          pinnedSessionIds: [],
          drafts: {},
          isStreaming: false,
          selectedReference: null,
          selectedDocument: null,
          viewMode: "list",
        }),
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
