import { create } from "zustand";
import type { Document } from "@/types/UserType";
import {
  fetchDocuments,
  uploadDocument,
  type UploadMetadata,
} from "@/services/documents.service";
import { EventSourcePolyfill } from "event-source-polyfill";
import { useAuthStore } from "@/store/authStore";

// ----------------------------------------------------------------
// 📝 상태 타입 정의
// ----------------------------------------------------------------

export interface UploadTask {
  type: "UPLOAD";
  id: string;
  fileName: string;
  progress: number;
  status: "UPLOADING" | "PARSING" | "COMPLETED" | "ERROR";
  errorMessage?: string;
  file?: File;
  metadata?: UploadMetadata;
  simulationInterval?: number;
}

export interface RequestTask {
  type: "REQUEST";
  id: string;
  requestId: number;
  fileName: string;
  progress: number;
  status: "PROCESSING" | "COMPLETED" | "ERROR";
  errorMessage?: string;
  eventSource?: EventSourcePolyfill;
  // [수정 1] 공통 함수(clearSimulation)에서 접근할 수 있도록 속성 추가
  simulationInterval?: number;
}

// 통합 작업 타입
export type BackgroundTask = UploadTask | RequestTask;

const ACTIVE_STATUSES = ["PARSING", "EMBEDDING", "PROCESSING", "UPLOADING"];

interface DocumentState {
  documents: Document[];
  selectedDocument: Document | null;
  isLoading: boolean;
  pollingIntervalId: number | null;
  currentDeptId: number;
  currentProjectId: number;
  taskQueue: BackgroundTask[];

  // Actions
  fetchDocuments: () => Promise<void>;
  setContext: (deptId: number, projectId: number) => void;
  startPolling: () => void;
  stopPolling: () => void;
  selectDocument: (doc: Document | null) => void;
  uploadFile: (file: File, metadata: UploadMetadata) => Promise<void>;
  retryUpload: (fileName: string) => Promise<void>;
  removeTask: (id: string) => void;
  startRequestSSE: (requestId: number, docName: string) => void;

  updateTaskProgress: (id: string, progress: number) => void;
  updateTaskStatus: (
    id: string,
    status: BackgroundTask["status"],
    error?: string
  ) => void;
  startSimulatedProgress: (fileName: string) => void;
  clearSimulation: (fileName: string) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  selectedDocument: null,
  isLoading: false,
  pollingIntervalId: null,
  currentDeptId: 0,
  currentProjectId: 0,
  taskQueue: [],

  setContext: (deptId, projectId) => {
    const { currentDeptId, currentProjectId } = get();
    if (currentDeptId !== deptId || currentProjectId !== projectId) {
      set({ currentDeptId: deptId, currentProjectId: projectId });
      get().fetchDocuments();
    }
  },

  fetchDocuments: async () => {
    const { currentDeptId, currentProjectId, pollingIntervalId } = get();

    if (!currentDeptId) return;
    if (!pollingIntervalId) set({ isLoading: true });

    try {
      const docs = await fetchDocuments(currentDeptId, currentProjectId);
      set({ documents: docs });

      const currentSelected = get().selectedDocument;
      if (currentSelected) {
        const updated = docs.find((d) => d.id === currentSelected.id);
        if (updated) set({ selectedDocument: updated });
      }

      get().taskQueue.forEach((task) => {
        if (task.type === "UPLOAD" && task.status === "PARSING") {
          const foundDoc = docs.find(
            (d) => d.originalFilename === task.fileName
          );
          if (foundDoc) {
            if (foundDoc.status === "PARSED") {
              get().clearSimulation(task.fileName);
              get().updateTaskProgress(task.id, 100);
              get().updateTaskStatus(task.id, "COMPLETED");
            } else if (foundDoc.status === "FAILED") {
              get().clearSimulation(task.fileName);
              get().updateTaskStatus(task.id, "ERROR", "서버 처리 실패");
            }
          }
        }
      });

      const hasServerProcessing = docs.some((d) =>
        ACTIVE_STATUSES.includes(d.status)
      );
      const hasQueueProcessing = get().taskQueue.some(
        (t) =>
          (t.type === "UPLOAD" &&
            (t.status === "UPLOADING" || t.status === "PARSING")) ||
          (t.type === "REQUEST" && t.status === "PROCESSING")
      );

      if (hasServerProcessing || hasQueueProcessing) {
        get().startPolling();
      } else {
        get().stopPolling();
      }
    } catch (error) {
      console.error("문서 목록 로드 실패:", error);
      get().stopPolling();
    } finally {
      set({ isLoading: false });
    }
  },

  startPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) return;
    const id = window.setInterval(async () => {
      await get().fetchDocuments();
    }, 3000);
    set({ pollingIntervalId: id });
  },

  stopPolling: () => {
    const { pollingIntervalId } = get();
    if (pollingIntervalId) {
      window.clearInterval(pollingIntervalId);
      set({ pollingIntervalId: null });
    }
  },

  selectDocument: (doc) => set({ selectedDocument: doc }),

  uploadFile: async (file, metadata) => {
    const fileName = file.name;
    const taskId = fileName;

    set((state) => {
      const filtered = state.taskQueue.filter((t) => t.id !== taskId);
      return {
        taskQueue: [
          ...filtered,
          {
            type: "UPLOAD",
            id: taskId,
            fileName,
            progress: 0,
            status: "UPLOADING",
            file,
            metadata,
          } as UploadTask,
        ],
      };
    });

    try {
      await uploadDocument(file, metadata, (rawPercent) => {
        const mappedPercent = Math.round(rawPercent * 0.5);
        get().updateTaskProgress(taskId, mappedPercent);
      });

      get().updateTaskStatus(taskId, "PARSING");
      get().startSimulatedProgress(taskId);
      await get().fetchDocuments();
    } catch (error: unknown) {
      let errMsg = "업로드 실패";
      if (error instanceof Error) errMsg = error.message;

      get().clearSimulation(taskId);
      get().updateTaskStatus(taskId, "ERROR", errMsg);
    }
  },

  retryUpload: async (fileName) => {
    const task = get().taskQueue.find((t) => t.id === fileName) as
      | UploadTask
      | undefined;
    if (task && task.type === "UPLOAD" && task.file && task.metadata) {
      get().updateTaskStatus(fileName, "UPLOADING");
      get().updateTaskProgress(fileName, 0);
      await get().uploadFile(task.file, task.metadata);
    }
  },

  startRequestSSE: (requestId, docName) => {
    const taskId = `req-${requestId}`;

    set((state) => {
      const filtered = state.taskQueue.filter((t) => t.id !== taskId);
      return {
        taskQueue: [
          ...filtered,
          {
            type: "REQUEST",
            id: taskId,
            requestId,
            fileName: docName,
            progress: 0,
            status: "PROCESSING",
          } as RequestTask,
        ],
      };
    });

    // 2. 토큰 가져오기 (수정됨: any 제거)
    const state = useAuthStore.getState();

    // 임시 인터페이스 정의: 우리가 찾으려는 필드(token)만 명시
    interface StateWithToken {
      token?: string;
      user?: { token?: string };
    }

    // unknown으로 먼저 변환 후, 우리가 정의한 구조로 단언 (Safe Casting)
    const safeState = state as unknown as StateWithToken;

    let token: string | null = null;

    // 1순위: 스토어 최상위 토큰 확인
    if (safeState.token) {
      token = safeState.token;
    }
    // 2순위: 유저 객체 내부 토큰 확인
    else if (safeState.user?.token) {
      token = safeState.user.token;
    }

    // 디버깅용 로그 (나중에 지우세요)
    console.log("현재 스토어 상태:", state);
    console.log("추출된 토큰:", token);

    if (!token) {
      get().updateTaskStatus(taskId, "ERROR", "인증 토큰 없음");
      return;
    }

    const eventSource = new EventSourcePolyfill(
      `/api/v1/events/request/${requestId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        heartbeatTimeout: 86400000,
      }
    );

    eventSource.onopen = () => {
      console.log(`[Req-${requestId}] SSE 연결 성공`);
    };

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (typeof data.progress === "number") {
          get().updateTaskProgress(taskId, data.progress);
        }

        if (data.status === "DONE" || data.status === "APPROVED") {
          get().updateTaskProgress(taskId, 100);
          get().updateTaskStatus(taskId, "COMPLETED");
          eventSource.close();
          get().fetchDocuments();
        } else if (data.status === "FAILED") {
          get().updateTaskStatus(taskId, "ERROR", data.error || "처리 실패");
          eventSource.close();
        }
      } catch (e) {
        console.error("SSE 파싱 에러", e);
      }
    };

    eventSource.onerror = (err) => {
      console.error(`[Req-${requestId}] SSE 에러`, err);
      get().updateTaskStatus(taskId, "ERROR", "연결 끊김");
      eventSource.close();
    };
  },

  removeTask: (id) => {
    get().clearSimulation(id);
    set((state) => ({
      taskQueue: state.taskQueue.filter((t) => t.id !== id),
    }));
  },

  updateTaskProgress: (id, progress) =>
    set((state) => ({
      taskQueue: state.taskQueue.map((t) =>
        t.id === id ? { ...t, progress } : t
      ),
    })),

  // [수정 2] any 제거 및 BackgroundTask 단언 사용
  updateTaskStatus: (id, status, error) =>
    set((state) => ({
      taskQueue: state.taskQueue.map((t) => {
        if (t.id === id) {
          return { ...t, status, errorMessage: error } as BackgroundTask;
        }
        return t;
      }),
    })),

  startSimulatedProgress: (id) => {
    get().clearSimulation(id);
    const intervalId = window.setInterval(() => {
      set((state) => {
        const queue = state.taskQueue.map((t) => {
          if (t.id === id && t.type === "UPLOAD" && t.status === "PARSING") {
            if (t.progress < 90) {
              return {
                ...t,
                progress: Math.min(t.progress + (Math.random() + 0.5), 90),
              };
            }
          }
          return t;
        });
        return { taskQueue: queue };
      });
    }, 500);

    set((state) => ({
      taskQueue: state.taskQueue.map((t) =>
        t.id === id ? { ...t, simulationInterval: intervalId } : t
      ),
    }));
  },

  // [오류 해결] 이제 BackgroundTask 타입에 simulationInterval이 존재하므로 안전하게 접근 가능
  clearSimulation: (id) => {
    const task = get().taskQueue.find((t) => t.id === id);
    if (task?.simulationInterval) {
      window.clearInterval(task.simulationInterval);
      set((state) => ({
        taskQueue: state.taskQueue.map((t) =>
          t.id === id ? { ...t, simulationInterval: undefined } : t
        ),
      }));
    }
  },
}));
