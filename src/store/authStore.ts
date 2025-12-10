import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types/UserType";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // 로그인 (유저 정보와 토큰 저장)
  login: (user: User, accessToken: string, refreshToken: string) => void;

  // 토큰 갱신 (Access Token만 업데이트)
  updateToken: (accessToken: string) => void;

  // 로그아웃 (초기화)
  logout: () => void;
}

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      updateToken: (accessToken) => set({ accessToken }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage), // 세션 스토리지 사용
    }
  )
);
