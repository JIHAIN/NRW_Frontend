import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Document } from "@/types/UserType";

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
  sessions: ChatSession[];

  // [수정] ChatPage에서 사용하는 이름(selectedSessionId)으로 변경
  selectedSessionId: string | null;

  selectedReference: { sourceName: string; text: string } | null;

  // 뷰어 관련 상태
  viewMode: "list" | "viewer";
  selectedDocument: Document | null;

  // Actions
  createSession: (id: string, title: string) => void;

  // [수정] 세션 선택 및 해제(null)가 가능하도록 변경
  setSelectedSessionId: (sessionId: string | null) => void;

  addMessage: (sessionId: string, message: Message) => void;
  setMessages: (sessionId: string, messages: Message[]) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;

  clearCurrentSession: () => void;

  setSelectedReference: (
    data: { sourceName: string; text: string } | null
  ) => void;

  setViewMode: (mode: "list" | "viewer") => void;
  openDocument: (doc: Document) => void;
  closeDocument: () => void;

  streamTokenToLastMessage: (sessionId: string, token: string) => void;
}

export const useChatStore = create(
  persist<ChatState>(
    (set) => ({
      sessions: [],
      // [수정] 초기값 이름 변경
      selectedSessionId: null,
      selectedReference: null,
      viewMode: "list",
      selectedDocument: null,

      createSession: (id, title) => {
        const newSession: ChatSession = {
          id: id,
          title: title,
          messages: [],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          selectedSessionId: id, // 새 세션 생성 시 바로 선택
        }));
      },

      // [수정] 이름 변경 및 null 허용 (새 채팅 가기 위함)
      setSelectedSessionId: (sessionId) =>
        set({ selectedSessionId: sessionId }),

      addMessage: (sessionId, message) =>
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id === sessionId) {
              return {
                ...session,
                messages: [...session.messages, message],
              };
            }
            return session;
          }),
        })),

      setMessages: (sessionId, messages) =>
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id === sessionId) {
              return { ...session, messages };
            }
            return session;
          }),
        })),

      updateSessionTitle: (sessionId, title) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, title } : s
          ),
        })),

      deleteSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          // [수정] 현재 보고 있는 세션을 삭제했다면, '새 채팅(null)' 화면으로 이동
          selectedSessionId:
            state.selectedSessionId === sessionId
              ? null
              : state.selectedSessionId,
        })),

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

      streamTokenToLastMessage: (sessionId, token) => {
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id === sessionId) {
              const lastMsgIndex = session.messages.length - 1;
              if (lastMsgIndex < 0) return session;

              const updatedMessages = [...session.messages];
              updatedMessages[lastMsgIndex] = {
                ...updatedMessages[lastMsgIndex],
                content: updatedMessages[lastMsgIndex].content + token,
              };

              return { ...session, messages: updatedMessages };
            }
            return session;
          }),
        }));
      },
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
