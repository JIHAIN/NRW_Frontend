import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Document } from "@/types/UserType";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sources?: string[];
  contextUsed?: string;
}

export interface ChatSession {
  id: string; // 서버 DB의 ID (숫자형이지만 처리는 string으로 통일)
  title: string;
  messages: Message[];
  createdAt: string;
}

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  selectedReference: { sourceName: string; text: string } | null;

  // 뷰어 관련 상태
  viewMode: "list" | "viewer";
  selectedDocument: Document | null;

  //  [수정 1] createSession이 매개변수(id, title)를 받을 수 있게 변경
  createSession: (id: string, title: string) => void;

  selectSession: (sessionId: string) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;
  clearCurrentSession: () => void;
  setSelectedReference: (
    data: { sourceName: string; text: string } | null
  ) => void;

  setViewMode: (mode: "list" | "viewer") => void;
  openDocument: (doc: Document) => void;
  closeDocument: () => void;
}

export const useChatStore = create(
  persist<ChatState>(
    (set) => ({
      sessions: [],
      currentSessionId: null,
      selectedReference: null,
      viewMode: "list",
      selectedDocument: null,

      //  [수정 구현] 외부(API)에서 만든 ID와 제목을 받아서 세션 생성
      createSession: (id, title) => {
        const newSession: ChatSession = {
          id: id,
          title: title,
          messages: [],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: id, // 생성 즉시 선택
        }));
      },

      selectSession: (sessionId) => set({ currentSessionId: sessionId }),

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

      updateSessionTitle: (sessionId, title) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, title } : s
          ),
        })),

      deleteSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          currentSessionId:
            state.currentSessionId === sessionId
              ? null
              : state.currentSessionId,
        })),

      clearCurrentSession: () => set({ currentSessionId: null }),
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
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
