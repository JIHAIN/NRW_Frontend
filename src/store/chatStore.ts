// src/store/chatStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Document } from "@/types/UserType";
import { createChatSession, streamChatResponse } from "@/services/chat.service";

// ----------------------------------------------------------------------
// 타입 정의
// ----------------------------------------------------------------------

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  sources?: string[];
  contextUsed?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

interface ChatState {
  // 1. 데이터 상태
  sessions: ChatSession[];
  selectedSessionId: string | null;

  // [NEW] 세션별 작성 중인 텍스트 저장 (Draft)
  // 예: { "session-1": "안녕하세요", "session-2": "질문있습니다" }
  drafts: Record<string, string>;

  // [NEW] 전역 스트리밍 상태 (백그라운드 처리를 위해 Store에서 관리)
  isStreaming: boolean;

  // 뷰어/참조 관련
  selectedReference: { sourceName: string; text: string } | null;
  viewMode: "list" | "viewer";
  selectedDocument: Document | null;

  // 2. 액션 (Actions)

  // 세션 조작
  createSession: (id: string, title: string) => void;
  setSelectedSessionId: (sessionId: string | null) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;

  // 메시지 및 드래프트 조작
  setDraft: (sessionId: string, text: string) => void; // 입력창 글자 저장
  addMessage: (sessionId: string, message: Message) => void;
  setMessages: (sessionId: string, messages: Message[]) => void;

  // [NEW] 메시지 전송 로직 (ChatPanel에서 이동)
  sendMessage: (props: {
    sessionId: string | null; // null이면 새 세션 생성
    content: string;
    userId: number; // API 호출용
  }) => Promise<void>;

  // UI 상태 조작
  setSelectedReference: (
    data: { sourceName: string; text: string } | null
  ) => void;
  setViewMode: (mode: "list" | "viewer") => void;
  openDocument: (doc: Document) => void;
  closeDocument: () => void;

  // [NEW] 사용자 변경/로그아웃 시 데이터 초기화
  resetAll: () => void;
}

// ----------------------------------------------------------------------
// Store 구현
// ----------------------------------------------------------------------

export const useChatStore = create(
  persist<ChatState>(
    (set, get) => ({
      // 초기 상태
      sessions: [],
      selectedSessionId: null,
      drafts: {},
      isStreaming: false,
      selectedReference: null,
      viewMode: "list",
      selectedDocument: null,

      // ----------------------------------------------------------
      // 액션 구현
      // ----------------------------------------------------------

      createSession: (id, title) => {
        const newSession: ChatSession = {
          id,
          title,
          messages: [],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          selectedSessionId: id,
          // 새 세션용 빈 드래프트 생성
          drafts: { ...state.drafts, [id]: "" },
        }));
      },

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
          delete newDrafts[sessionId]; // 드래프트도 삭제

          return {
            sessions: state.sessions.filter((s) => s.id !== sessionId),
            drafts: newDrafts,
            selectedSessionId:
              state.selectedSessionId === sessionId
                ? null
                : state.selectedSessionId,
          };
        }),

      // [핵심] 메시지 전송 및 백그라운드 스트리밍 처리
      sendMessage: async ({ sessionId, content, userId }) => {
        const store = get();
        if (store.isStreaming || !content.trim()) return;

        let activeId = sessionId;
        const trimmed = content.trim();

        // 1. 세션이 없으면 생성 (새 채팅)
        if (!activeId) {
          try {
            const title =
              trimmed.length > 20 ? trimmed.substring(0, 20) + "..." : trimmed;
            // API 호출로 세션 ID 발급
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

        // 2. 상태 업데이트: 로딩 시작, 입력창 비우기(Draft 제거)
        set((state) => {
          const newDrafts = { ...state.drafts };
          // 메시지를 보냈으니 해당 방의 임시저장 글은 삭제
          if (activeId) delete newDrafts[activeId];
          return {
            isStreaming: true,
            drafts: newDrafts,
            selectedSessionId: activeId, // 혹시 모르니 선택 확실히
          };
        });

        // 3. 사용자 메시지 UI에 즉시 추가 (낙관적 업데이트)
        const userMsg: Message = {
          id: `u-${Date.now()}`,
          role: "user",
          content: trimmed,
          createdAt: new Date().toISOString(),
        };
        get().addMessage(activeId, userMsg);

        // 4. 봇 메시지(빈 껍데기) UI에 추가
        const botMsgId = `b-${Date.now()}`;
        const botMsg: Message = {
          id: botMsgId,
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
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
            (token) => {
              // 토큰 수신 시마다 Store 상태 업데이트
              // (Store 내부는 React 컴포넌트 생명주기와 무관하게 동작하므로 백그라운드 처리가 됨)
              set((state) => ({
                sessions: state.sessions.map((session) => {
                  if (session.id === activeId) {
                    const msgs = [...session.messages];
                    const lastIdx = msgs.length - 1;
                    if (lastIdx >= 0) {
                      // 마지막 메시지(봇 메시지)에 토큰 누적
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
            }
          );
        } catch (error) {
          console.error("Streaming error in Store:", error);
          // 에러 발생 시 봇 메시지에 에러 문구 추가
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
                      "\n[오류가 발생했습니다. 잠시 후 다시 시도해주세요.]",
                  };
                  return { ...session, messages: msgs };
                }
              }
              return session;
            }),
          }));
        } finally {
          // 6. 스트리밍 종료
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

      // [핵심] 사용자 변경/로그아웃 시 모든 데이터 초기화
      resetAll: () =>
        set({
          sessions: [],
          selectedSessionId: null,
          drafts: {},
          isStreaming: false,
          selectedReference: null,
          selectedDocument: null,
          viewMode: "list",
        }),
    }),
    {
      name: "chat-storage", // 로컬 스토리지 키 이름
      storage: createJSONStorage(() => localStorage),
    }
  )
);
