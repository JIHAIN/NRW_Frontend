// src/store/systemStore.ts
import { create } from "zustand";
import type { Department, Project } from "@/types/UserType";

// --------------------------------------------------------------------------
// 🧪 [Mock Data] 백엔드 연결 전 테스트용 데이터 (SQL과 동일하게 구성)
// --------------------------------------------------------------------------
const MOCK_DEPARTMENTS: Department[] = [
  {
    id: 1,
    name: "DT 본부",
    description: "Digital Transformation 총괄",
    createdAt: "2024-01-01",
  },
  {
    id: 2,
    name: "경영지원본부",
    description: "인사/총무/재무",
    createdAt: "2024-01-01",
  },
  {
    id: 3,
    name: "전략마케팅본부",
    description: "글로벌 마케팅",
    createdAt: "2024-01-01",
  },
];

const MOCK_PROJECTS: Project[] = [
  // DT 본부 (1)
  {
    id: 1,
    departmentId: 1,
    name: "차세대 AI 지식관리 시스템",
    status: "ACTIVE",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-10",
  },
  {
    id: 2,
    departmentId: 1,
    name: "MSA 기반 클라우드 전환",
    status: "ACTIVE",
    createdAt: "2023-06-01",
    updatedAt: "2024-05-30",
  },
  {
    id: 3,
    departmentId: 1,
    name: "사내 보안 관제 고도화",
    status: "COMPLETED",
    createdAt: "2024-03-15",
    updatedAt: "2024-09-15",
  },
  // 경영지원본부 (2)
  {
    id: 6,
    departmentId: 2,
    name: "스마트 오피스 구축",
    status: "COMPLETED",
    createdAt: "2024-02-01",
    updatedAt: "2024-07-31",
  },
  {
    id: 7,
    departmentId: 2,
    name: "2025 신입사원 공채",
    status: "ACTIVE",
    createdAt: "2024-09-01",
    updatedAt: "2024-09-01",
  },
  // 전략마케팅본부 (3)
  {
    id: 11,
    departmentId: 3,
    name: "글로벌 브랜드 리브랜딩",
    status: "ACTIVE",
    createdAt: "2024-01-15",
    updatedAt: "2024-08-15",
  },
];

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
  addDepartment: (name: string) => void;
  deleteDepartment: (id: number) => void;

  addProject: (project: Project) => void;
  deleteProject: (id: number) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  departments: [],
  projects: [],
  isLoading: false,

  // 1. 데이터 가져오기 (API 호출 시뮬레이션)
  fetchSystemData: async () => {
    set({ isLoading: true });

    // 📡 [나중에 백엔드 연결 시 사용]
    /*
    try {
      const [deptRes, projRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/projects")
      ]);
      const depts = await deptRes.json();
      const projs = await projRes.json();
      set({ departments: depts, projects: projs, isLoading: false });
    } catch (e) { ... }
    */

    // 🧪 [현재] Mock 데이터 로드
    setTimeout(() => {
      set({
        departments: MOCK_DEPARTMENTS,
        projects: MOCK_PROJECTS,
        isLoading: false,
      });
    }, 500);
  },

  // 2. 부서 추가
  addDepartment: (name) =>
    set((state) => {
      // 임시 ID 생성 (가장 큰 ID + 1)
      const newId =
        state.departments.length > 0
          ? Math.max(...state.departments.map((d) => d.id)) + 1
          : 1;
      const newDept: Department = {
        id: newId,
        name,
        createdAt: new Date().toISOString(),
      };
      return { departments: [...state.departments, newDept] };
    }),

  // 3. 부서 삭제 (연관된 프로젝트도 UI에서 안보이게 처리)
  deleteDepartment: (id) =>
    set((state) => ({
      departments: state.departments.filter((d) => d.id !== id),
      projects: state.projects.filter((p) => p.departmentId !== id), // Cascade delete 시늉
    })),

  // 4. 프로젝트 추가
  addProject: (project) =>
    set((state) => {
      const newId =
        state.projects.length > 0
          ? Math.max(...state.projects.map((p) => p.id)) + 1
          : 1;
      const newProject = { ...project, id: newId };
      return { projects: [...state.projects, newProject] };
    }),

  // 5. 프로젝트 삭제
  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
}));
