import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types/UserType";

interface AuthState {
  user: User | null; // 로그인한 유저 객체 전체
  isAuthenticated: boolean;

  // 로그인 (User 객체를 받아서 저장)
  login: (userInfo: User) => void;
  // 로그아웃
  logout: () => void;
}

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (userInfo) => set({ user: userInfo, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage), // 세션 스토리지 (새로고침 유지, 탭 닫으면 삭제)
    }
  )
);
