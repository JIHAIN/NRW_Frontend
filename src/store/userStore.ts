import { create } from "zustand";
import type { User } from "@/types/UserType";
import {
  fetchUsersAPI,
  fetchUserByIdAPI,
  createUser,
  updateUserAPI,
  deleteUserAPI,
  type CreateUserRequest,
} from "@/services/user.service";

// --------------------------------------------------------------------------
// Store Interface
// --------------------------------------------------------------------------
interface UserState {
  users: User[];
  isLoading: boolean;

  fetchUsers: () => Promise<void>;
  fetchUserById: (userId: number) => Promise<User>; // 단일 유저 조회 추가
  updateUser: (updatedUser: User) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
  addUser: (newUser: CreateUserRequest) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  isLoading: false,

  // 1. 사용자 목록 가져오기
  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const data = await fetchUsersAPI();
      set({ users: data, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  // 2. 단일 사용자 가져오기 (로그인 시뮬레이션용)
  fetchUserById: async (userId: number) => {
    set({ isLoading: true });
    try {
      const user = await fetchUserByIdAPI(userId);
      set({ isLoading: false });
      return user;
    } catch (error) {
      set({ isLoading: false });
      console.error("User fetch failed:", error);
      throw error;
    }
  },

  // 3. 사용자 수정
  updateUser: async (updatedUser) => {
    try {
      await updateUserAPI(updatedUser.id, {
        user_name: updatedUser.userName,
        dept_id: updatedUser.departmentId || 0,
        role: updatedUser.role,
      });

      await get().fetchUsers();
    } catch (error) {
      console.error("Update failed:", error);
      throw error;
    }
  },

  // 4. 사용자 삭제
  deleteUser: async (userId) => {
    try {
      await deleteUserAPI(userId);
      set((state) => ({
        users: state.users.filter((u) => u.id !== userId),
      }));
    } catch (error) {
      console.error("Delete failed:", error);
      throw error;
    }
  },

  // 5. 사용자 추가
  addUser: async (newUserRequest) => {
    try {
      await createUser(newUserRequest);
      await get().fetchUsers();
    } catch (error) {
      console.error("User creation failed:", error);
      throw error;
    }
  },
}));
