import { create } from "zustand";
import type { Document } from "@/types/UserType";
import {
  fetchDocuments,
  uploadDocument,
  type UploadMetadata,
} from "@/services/documents.service";

// ----------------------------------------------------------------
// 📝 상태 타입 정의
// ----------------------------------------------------------------

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: "UPLOADING" | "PARSING" | "COMPLETED" | "ERROR";
  errorMessage?: string;
  file?: File;
  metadata?: UploadMetadata;
  simulationInterval?: number;
}

interface DocumentState {
  documents: Document[];
  selectedDocument: Document | null;
  isLoading: boolean;
  pollingIntervalId: number | null;

  currentDeptId: number;
  currentProjectId: number;

  uploadQueue: UploadProgress[];

  fetchDocuments: () => Promise<void>;
  setContext: (deptId: number, projectId: number) => void;

  startPolling: () => void;
  stopPolling: () => void;
  selectDocument: (doc: Document | null) => void;

  uploadFile: (file: File, metadata: UploadMetadata) => Promise<void>;
  retryUpload: (fileName: string) => Promise<void>;
  removeUploadFromQueue: (fileName: string) => void;

  updateUploadProgress: (fileName: string, progress: number) => void;
  updateUploadStatus: (
    fileName: string,
    status: UploadProgress["status"],
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

  uploadQueue: [],

  setContext: (deptId, projectId) => {
    const { currentDeptId, currentProjectId } = get();
    if (currentDeptId !== deptId || currentProjectId !== projectId) {
      set({ currentDeptId: deptId, currentProjectId: projectId });
      get().fetchDocuments();
    }
  },

  // 1. 문서 목록 조회 & 폴링 로직
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

      // 업로드 큐 완료 체크 및 동기화
      get().uploadQueue.forEach((item) => {
        if (item.status === "PARSING") {
          const foundDoc = docs.find(
            (d) => d.originalFilename === item.fileName
          );

          if (foundDoc) {
            // ✨ [수정] PARSED 제거, COMPLETED만 확인
            if (
              foundDoc.status === "COMPLETED" ||
              foundDoc.status === "PARSED" // 👈 여기 추가!
            ) {
              get().clearSimulation(item.fileName);
              get().updateUploadProgress(item.fileName, 100);
              get().updateUploadStatus(item.fileName, "COMPLETED");
            }
            // ✨ [수정] ERROR -> FAILED (Document 타입에 맞춤)
            else if (foundDoc.status === "FAILED") {
              get().clearSimulation(item.fileName);
              get().updateUploadStatus(
                item.fileName,
                "ERROR",
                "서버 처리 실패"
              );
            }
          }
        }
      });

      // 폴링 유지 조건 확인
      // 1. 서버 목록에 처리 중인 문서가 있거나
      // ✨ [수정] UPLOADING 제거 (Document 타입에 없음)
      const hasServerPending = docs.some(
        (d) => d.status === "PARSING" || d.status === "EMBEDDING"
      );

      // 2. 내 업로드 큐에 처리 중인 항목이 있을 때
      const hasQueuePending = get().uploadQueue.some(
        (q) => q.status === "PARSING" || q.status === "UPLOADING"
      );

      if (hasServerPending || hasQueuePending) {
        get().startPolling();
      } else {
        get().stopPolling();
      }
    } catch (error) {
      console.error("문서 목록 로드 실패:", error);
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

    set((state) => {
      const filtered = state.uploadQueue.filter(
        (item) => item.fileName !== fileName
      );
      return {
        uploadQueue: [
          ...filtered,
          { fileName, progress: 0, status: "UPLOADING", file, metadata },
        ],
      };
    });

    try {
      await uploadDocument(file, metadata, (rawPercent) => {
        const mappedPercent = Math.round(rawPercent * 0.5);
        get().updateUploadProgress(fileName, mappedPercent);
      });

      get().updateUploadStatus(fileName, "PARSING");
      get().startSimulatedProgress(fileName);

      await get().fetchDocuments();
      // ✨ [수정] any 제거하고 타입 안전하게 처리
    } catch (error: unknown) {
      let errMsg = "업로드 실패";
      if (error instanceof Error) {
        errMsg = error.message;
      }
      get().clearSimulation(fileName);
      get().updateUploadStatus(fileName, "ERROR", errMsg);
    }
  },

  startSimulatedProgress: (fileName) => {
    get().clearSimulation(fileName);

    const intervalId = window.setInterval(() => {
      set((state) => {
        const queue = state.uploadQueue.map((item) => {
          if (item.fileName === fileName && item.status === "PARSING") {
            if (item.progress < 90) {
              const increment = Math.random() + 0.5;
              return {
                ...item,
                progress: Math.min(item.progress + increment, 90),
              };
            }
          }
          return item;
        });
        return { uploadQueue: queue };
      });
    }, 500);

    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.fileName === fileName
          ? { ...item, simulationInterval: intervalId }
          : item
      ),
    }));
  },

  clearSimulation: (fileName) => {
    const item = get().uploadQueue.find((i) => i.fileName === fileName);
    if (item?.simulationInterval) {
      window.clearInterval(item.simulationInterval);
      set((state) => ({
        uploadQueue: state.uploadQueue.map((i) =>
          i.fileName === fileName ? { ...i, simulationInterval: undefined } : i
        ),
      }));
    }
  },

  retryUpload: async (fileName) => {
    const item = get().uploadQueue.find((i) => i.fileName === fileName);
    if (item && item.file && item.metadata) {
      get().updateUploadStatus(fileName, "UPLOADING");
      get().updateUploadProgress(fileName, 0);
      await get().uploadFile(item.file, item.metadata);
    }
  },

  removeUploadFromQueue: (fileName) => {
    get().clearSimulation(fileName);
    set((state) => ({
      uploadQueue: state.uploadQueue.filter(
        (item) => item.fileName !== fileName
      ),
    }));
  },

  updateUploadProgress: (fileName, progress) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.fileName === fileName ? { ...item, progress } : item
      ),
    })),

  updateUploadStatus: (fileName, status, error) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.fileName === fileName
          ? { ...item, status, errorMessage: error }
          : item
      ),
    })),
}));
