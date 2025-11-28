import { create } from "zustand";
import type { Department, Project } from "@/types/UserType";
import {
  fetchDepartments,
  fetchProjects,
  createDepartment,
  deleteDepartmentAPI,
  createProject,
  deleteProjectAPI,
} from "@/services/system.service";

// --------------------------------------------------------------------------
// Store Interface
// --------------------------------------------------------------------------
interface SystemState {
  departments: Department[];
  projects: Project[];
  isLoading: boolean;

  // 데이터 조회
  fetchSystemData: () => Promise<void>;

  // 관리자용 액션 (CRUD)
  addDepartment: (name: string) => Promise<void>; // Async로 변경
  deleteDepartment: (id: number) => Promise<void>; // Async로 변경

  addProject: (project: Project) => Promise<void>; // Async로 변경
  deleteProject: (id: number) => Promise<void>; // Async로 변경
}

export const useSystemStore = create<SystemState>((set, get) => ({
  departments: [],
  projects: [],
  isLoading: false,

  // 1. 데이터 가져오기 (실제 API 호출)
  fetchSystemData: async () => {
    // 중복 방지 코드
    if (get().isLoading) return;

    set({ isLoading: true });
    try {
      // 부서와 프로젝트를 병렬로 호출
      const [depts, projs] = await Promise.all([
        fetchDepartments(),
        fetchProjects(),
      ]);
      set({ departments: depts, projects: projs, isLoading: false });
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      set({ isLoading: false });
    }
  },

  // 2. 부서 추가
  addDepartment: async (name) => {
    try {
      await createDepartment(name);
      // 추가 후 목록 갱신 (서버에서 생성된 ID를 받아오기 위해 재조회)
      await get().fetchSystemData();
    } catch (error) {
      console.error("부서 추가 실패:", error);
      alert("부서 추가 중 오류가 발생했습니다.");
    }
  },

  // 3. 부서 삭제
  deleteDepartment: async (id) => {
    try {
      await deleteDepartmentAPI(id);
      // 삭제 후 목록 갱신
      await get().fetchSystemData();
    } catch (error) {
      console.error("부서 삭제 실패:", error);
      alert("부서 삭제 중 오류가 발생했습니다.");
    }
  },

  // 4. 프로젝트 추가
  addProject: async (project) => {
    try {
      // API 호출 (project 객체에서 필요한 이름과 부서ID만 추출)
      await createProject(project.name, project.departmentId);
      // 추가 후 목록 갱신
      await get().fetchSystemData();
    } catch (error) {
      console.error("프로젝트 추가 실패:", error);
      alert("프로젝트 추가 중 오류가 발생했습니다.");
    }
  },

  // 5. 프로젝트 삭제
  deleteProject: async (id) => {
    try {
      await deleteProjectAPI(id);
      // 삭제 후 목록 갱신
      await get().fetchSystemData();
    } catch (error) {
      console.error("프로젝트 삭제 실패:", error);
      alert("프로젝트 삭제 중 오류가 발생했습니다.");
    }
  },
}));
