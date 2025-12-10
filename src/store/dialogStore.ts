// src/store/dialogStore.ts
import { create } from "zustand";

type DialogType = "alert" | "confirm";
type DialogVariant = "info" | "success" | "warning" | "error";

interface DialogOptions {
  title?: string;
  message: string;
  variant?: DialogVariant;
}

interface DialogState {
  isOpen: boolean;
  type: DialogType;
  options: DialogOptions;
  // Promise resolve 함수 저장 (사용자 응답 대기용)
  resolver: ((value: boolean) => void) | null;

  // Actions
  alert: (options: DialogOptions | string) => Promise<void>;
  confirm: (options: DialogOptions | string) => Promise<boolean>;
  close: (result: boolean) => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  isOpen: false,
  type: "alert",
  options: { message: "", variant: "info" },
  resolver: null,

  alert: async (payload) => {
    const options =
      typeof payload === "string" ? { message: payload } : payload;

    // 이전 다이얼로그가 있다면 닫고 새로 엽니다.
    if (get().isOpen) get().close(false);

    return new Promise((resolve) => {
      set({
        isOpen: true,
        type: "alert",
        options: { title: "알림", variant: "info", ...options },
        resolver: () => resolve(), // Alert는 결과값 불필요
      });
    });
  },

  confirm: async (payload) => {
    const options =
      typeof payload === "string" ? { message: payload } : payload;

    if (get().isOpen) get().close(false);

    return new Promise((resolve) => {
      set({
        isOpen: true,
        type: "confirm",
        options: { title: "확인", variant: "warning", ...options },
        resolver: resolve, // Confirm은 true/false 반환
      });
    });
  },

  close: (result: boolean) => {
    const { resolver } = get();
    if (resolver) resolver(result); // 기다리던 Promise에 신호 보냄

    set({
      isOpen: false,
      resolver: null,
    });
  },
}));
