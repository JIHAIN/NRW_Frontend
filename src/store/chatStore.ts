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
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  selectedReference: { sourceName: string; text: string } | null;

  // 뷰어 관련 상태
  viewMode: "list" | "viewer"; // 사이드바 모드 (리스트 vs 뷰어)
  selectedDocument: Document | null; // 현재 보고 있는 문서

  createSession: () => string; // ID 반환 필수
  selectSession: (sessionId: string) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;
  clearCurrentSession: () => void;
  setSelectedReference: (
    data: { sourceName: string; text: string } | null
  ) => void;

  // 문서 뷰어 액션
  setViewMode: (mode: "list" | "viewer") => void;
  openDocument: (doc: Document) => void; // 문서를 열고 뷰어 모드로 전환
  closeDocument: () => void; // 뷰어 닫고 리스트로 전환
}

export const useChatStore = create(
  persist<ChatState>(
    (set) => ({
      sessions: [],
      currentSessionId: null,
      selectedReference: null,

      // 초기값
      viewMode: "list",
      selectedDocument: null,

      createSession: () => {
        const newId = Date.now().toString();
        const newSession: ChatSession = {
          id: newId,
          title: "새로운 대화",
          messages: [],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newId, // 생성 즉시 선택
        }));
        return newId; // ✨ 생성된 ID 반환 (중요)
      },

      selectSession: (sessionId) => set({ currentSessionId: sessionId }),

      addMessage: (sessionId, message) =>
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id === sessionId) {
              // 첫 질문일 경우 제목 업데이트 로직을 여기서 처리하지 않음 (ChatPanel에서 제어)
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

      // 구현
      setViewMode: (mode) => set({ viewMode: mode }),

      openDocument: (doc) =>
        set({
          selectedDocument: doc,
          viewMode: "viewer", // 문서 열면 자동으로 뷰어 모드 전환
          selectedReference: null, // 일반 문서 열 때 RAG 참조 닫기
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
