// src/store/chatStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Document } from "@/types/UserType";
import { createChatSession, streamChatResponse } from "@/services/chat.service";

// ----------------------------------------------------------------------
// 타입 정의
// ----------------------------------------------------------------------

// 채팅 메시지 구조체
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  sources?: string[]; // 답변에 사용된 참조 문서 목록
  contextUsed?: string; // 답변 생성에 사용된 원문 컨텍스트
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

  drafts: Record<string, string>; // 세션별 입력창에 작성 중인 텍스트 임시 저장
  isStreaming: boolean; // 현재 답변을 생성(스트리밍) 중인지 여부

  selectedReference: { sourceName: string; text: string } | null; // 선택된 참조 문서 정보
  viewMode: "list" | "viewer"; // 좌측 패널 뷰 모드 (문서 목록 vs 문서 상세)
  selectedDocument: Document | null; // 현재 보고 있는 문서 객체

  // 2. 액션 (Actions)

  // 세션 관리
  createSession: (id: string, title: string) => void;
  setSelectedSessionId: (sessionId: string | null) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;

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
    data: { sourceName: string; text: string } | null
  ) => void;
  setViewMode: (mode: "list" | "viewer") => void;
  openDocument: (doc: Document) => void;
  closeDocument: () => void;

  // 전체 초기화 (로그아웃 등)
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
      drafts: {},
      isStreaming: false,
      selectedReference: null,
      viewMode: "list",
      selectedDocument: null,

      // ----------------------------------------------------------
      // 액션 구현
      // ----------------------------------------------------------

      // 새로운 세션을 스토어에 추가
      createSession: (id, title) => {
        set((state) => {
          // [수정] 이미 존재하는 세션 ID라면 상태를 변경하지 않음 (DB 데이터와 충돌 방지)
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
            sessions: [newSession, ...state.sessions], // 최신 세션을 앞에 배치
            selectedSessionId: id,
            drafts: { ...state.drafts, [id]: "" }, // 해당 세션의 드래프트 초기화
          };
        });
      },

      setSelectedSessionId: (sessionId) =>
        set({ selectedSessionId: sessionId }),

      setDraft: (sessionId, text) =>
        set((state) => ({
          drafts: { ...state.drafts, [sessionId]: text },
        })),

      // 특정 세션에 메시지 단건 추가
      addMessage: (sessionId, message) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, messages: [...s.messages, message] }
              : s
          ),
        })),

      // 특정 세션의 메시지 전체 교체 (DB 동기화용)
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
            drafts: newDrafts,
            // 삭제된 세션이 현재 선택된 세션이었다면 선택 해제
            selectedSessionId:
              state.selectedSessionId === sessionId
                ? null
                : state.selectedSessionId,
          };
        }),

      // [핵심 기능] 메시지 전송 및 스트리밍 응답 처리
      sendMessage: async ({ sessionId, content, userId }) => {
        const store = get();

        // 이미 스트리밍 중이거나 내용이 없으면 무시
        if (store.isStreaming || !content.trim()) return;

        let activeId = sessionId;
        const trimmed = content.trim();

        // 1. 세션 ID가 없으면(새 채팅) 서버에 세션 생성 요청
        if (!activeId) {
          try {
            const title =
              trimmed.length > 20 ? trimmed.substring(0, 20) + "..." : trimmed;

            // chat.service.ts에서 생성된 ID(string)를 받아옴
            const newSessionId = await createChatSession({
              user_id: userId,
              title,
            });
            activeId = String(newSessionId);

            // 스토어에도 새 세션 등록
            store.createSession(activeId, title);
          } catch (e) {
            console.error("세션 생성 실패:", e);
            return;
          }
        }

        // 2. UI 상태 업데이트 (로딩 시작, 드래프트 비우기)
        set((state) => {
          const newDrafts = { ...state.drafts };
          if (activeId) delete newDrafts[activeId];
          return {
            isStreaming: true,
            drafts: newDrafts,
            selectedSessionId: activeId,
          };
        });

        // 3. 사용자 메시지 즉시 추가 (Optimistic Update)
        const userMsg: Message = {
          id: `u-${Date.now()}`,
          role: "user",
          content: trimmed,
          createdAt: new Date().toISOString(),
        };
        get().addMessage(activeId, userMsg);

        // 4. 봇의 응답 메시지 공간(빈 껍데기) 미리 추가
        const botMsgId = `b-${Date.now()}`;
        const botMsg: Message = {
          id: botMsgId,
          role: "assistant",
          content: "", // 내용은 비워둠
          createdAt: new Date().toISOString(),
        };
        get().addMessage(activeId, botMsg);

        // 5. 스트리밍 API 호출 및 실시간 업데이트
        try {
          await streamChatResponse(
            {
              conversation_id: activeId,
              message: trimmed,
              user_id: userId,
            },
            // 콜백: 토큰(한 글자 혹은 덩어리)이 올 때마다 실행
            (token) => {
              set((state) => ({
                sessions: state.sessions.map((session) => {
                  if (session.id === activeId) {
                    const msgs = [...session.messages];
                    const lastIdx = msgs.length - 1;

                    // 마지막 메시지(위에서 만든 botMsg)에 토큰을 이어 붙임
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
            }
          );
        } catch (error) {
          console.error("Streaming error in Store:", error);
          // 에러 발생 시 마지막 메시지에 에러 문구 추가
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
          // 스트리밍 종료 상태로 변경
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
          drafts: {},
          isStreaming: false,
          selectedReference: null,
          selectedDocument: null,
          viewMode: "list",
        }),
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage), // 로컬 스토리지에 상태 영구 저장
    }
  )
);
