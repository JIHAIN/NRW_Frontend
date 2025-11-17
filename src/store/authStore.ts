// src/store/authStore.ts

//  1. (변경) '기본 내보내기(default)'가 아닌 '명명된(named)' import로 변경
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
// 1. 스토어의 상태(State)와 액션(Actions) 타입 정의
interface AuthState {
  role: string;
  department: string;
  project: string;
  setAuth: (role: string, department: string, project: string) => void;
}

// 2. 스토어 생성
export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      role: "user",
      department: "개발팀",
      project: "Project_A",
      setAuth: (role, department, project) =>
        set({ role, department, project }),
    }),
    {
      name: "auth-storage", // localStorage에 저장될 키 이름
      storage: createJSONStorage(() => sessionStorage), // 기본은 localStorage, 원하면 sessionStorage로 변경 가능
    }
  )
);
