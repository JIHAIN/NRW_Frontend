// src/store/userStore.ts
import { create } from "zustand";
import type { User } from "@/types/UserType";

// --------------------------------------------------------------------------
// 🧪 [Mock Data] DB 스키마(UserType)와 100% 일치시킨 더미 데이터
// --------------------------------------------------------------------------
const MOCK_DB_USERS: User[] = [
  {
    id: 1,
    accountId: "super_admin", // email 대신 accountId 사용
    userName: "총괄관리자", // name 대신 userName 사용
    role: "SUPER_ADMIN", // 한글 대신 ENUM 코드 사용
    departmentId: 1, // DT 본부
    isActive: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: 2,
    accountId: "manager_dt",
    userName: "김DT부장",
    role: "MANAGER",
    departmentId: 1, // DT 본부
    isActive: true,
    createdAt: "2024-01-05",
    updatedAt: "2024-01-05",
  },
  {
    id: 3,
    accountId: "user_dt",
    userName: "이AI사원",
    role: "USER",
    departmentId: 1, // DT 본부
    projectId: 1, // 차세대 AI 프로젝트 소속
    isActive: true,
    createdAt: "2024-02-01",
    updatedAt: "2024-02-01",
  },
  {
    id: 4,
    accountId: "hr_manager",
    userName: "박인사",
    role: "USER",
    departmentId: 2, // 경영지원본부
    isActive: true, // (퇴사자라면 false)
    createdAt: "2024-03-01",
    updatedAt: "2024-03-01",
  },
];

// --------------------------------------------------------------------------
// Store Interface
// --------------------------------------------------------------------------
interface UserState {
  users: User[];
  isLoading: boolean;

  fetchUsers: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  deleteUser: (userId: number) => void;
  addUser: (newUser: User) => void; // ✨ 관리자가 유저 추가할 때 필요
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  isLoading: false,

  // 1. 사용자 목록 가져오기
  fetchUsers: async () => {
    set({ isLoading: true });

    // 📡 [나중에 백엔드 API 연동 시]
    /*
    const res = await fetch("/api/users");
    const data = await res.json();
    set({ users: data, isLoading: false });
    */

    // 🧪 [현재] Mock 데이터 로드
    setTimeout(() => {
      set({ users: MOCK_DB_USERS, isLoading: false });
    }, 500);
  },

  // 2. 사용자 수정 (화면 갱신용)
  updateUser: (updatedUser) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === updatedUser.id ? updatedUser : u
      ),
    })),

  // 3. 사용자 삭제 (화면 갱신용)
  deleteUser: (userId) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
    })),

  // 4. 사용자 추가 (화면 갱신용)
  addUser: (newUser) =>
    set((state) => ({
      users: [...state.users, { ...newUser, id: Date.now() }], // ID는 임시로 생성
    })),
}));
