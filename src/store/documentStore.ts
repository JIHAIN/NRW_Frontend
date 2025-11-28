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

  // [추가] 현재 조회 중인 부서/프로젝트 ID (기본값 설정 필요)
  currentDeptId: number;
  currentProjectId: number;

  uploadQueue: UploadProgress[];

  // [수정] 인자 없이 호출하되, 내부 상태(currentDeptId)를 사용
  fetchDocuments: () => Promise<void>;

  // [추가] 부서/프로젝트 변경 시 호출
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

  // 기본값 (앱 진입 시 적절히 초기화 필요)
  currentDeptId: 1,
  currentProjectId: 1,

  uploadQueue: [],

  // [추가] 컨텍스트 변경 함수
  setContext: (deptId, projectId) => {
    set({ currentDeptId: deptId, currentProjectId: projectId });
    get().fetchDocuments(); // 컨텍스트 바뀌면 목록 새로고침
  },

  // 1. 문서 목록 조회 & 폴링
  fetchDocuments: async () => {
    // 폴링 중이 아닐 때만 로딩 표시 (깜빡임 방지)
    if (!get().pollingIntervalId) set({ isLoading: true });

    const { currentDeptId, currentProjectId } = get();

    try {
      // [수정] 서비스 함수에 현재 ID 전달
      const docs = await fetchDocuments(currentDeptId, currentProjectId);
      set({ documents: docs });

      // 선택된 문서 최신화 (업데이트 반영)
      const currentSelected = get().selectedDocument;
      if (currentSelected) {
        const updated = docs.find((d) => d.id === currentSelected.id);
        if (updated) set({ selectedDocument: updated });
      }

      // 업로드/파싱 완료 체크 로직
      get().uploadQueue.forEach((item) => {
        if (item.status === "PARSING") {
          const foundDoc = docs.find(
            (d) => d.originalFilename === item.fileName
          );

          if (foundDoc) {
            // 서버 상태가 COMPLETED/PARSED면 완료 처리
            if (
              foundDoc.status === "COMPLETED" ||
              foundDoc.status === "PARSING"
            ) {
              get().clearSimulation(item.fileName);
              get().updateUploadProgress(item.fileName, 100);
              get().updateUploadStatus(item.fileName, "COMPLETED");
            } else if (foundDoc.status === "FAILED") {
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

      // 파싱 중인 문서가 있으면 폴링 유지
      const hasPending = docs.some(
        (d) => d.status === "PARSING" || d.status === "EMBEDDING"
      );

      // 업로드 큐에 "PARSING" 중인 항목이 있어도 폴링 유지
      const hasQueuePending = get().uploadQueue.some(
        (q) => q.status === "PARSING"
      );

      if (hasPending || hasQueuePending) {
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
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "업로드 실패";
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
