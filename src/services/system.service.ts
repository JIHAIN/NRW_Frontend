import { API_BASE_URL } from "@/lib/constants";
import type { Department, Project } from "@/types/UserType";

// --------------------------------------------------------------------------
// 📝 백엔드 응답 타입 정의 (DTO)
// --------------------------------------------------------------------------

// 부서 응답 데이터 모양
interface BackendDepartment {
  id: number;
  dept_name: string; // 백엔드: dept_name
  description?: string;
  created_at: string; // 백엔드: created_at
}

// 프로젝트 응답 데이터 모양
interface BackendProject {
  project_id: number;
  project_name: string; // 백엔드: project_name
  dept_id: number; // 백엔드: dept_id (추정)
  description?: string;
  status?: "ACTIVE" | "COMPLETED";
  created_at: string;
  updated_at: string;
}

// --------------------------------------------------------------------------
// 1. 부서 (Department) API
// --------------------------------------------------------------------------

// 부서 목록 조회
export const fetchDepartments = async (): Promise<Department[]> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/dept`);
  if (!response.ok) throw new Error("부서 목록을 불러오는데 실패했습니다.");

  const data: BackendDepartment[] = await response.json(); // ✨ 타입 명시

  // 변환: BackendDepartment -> Department
  return data.map((item) => ({
    id: item.id,
    dept_name: item.dept_name, // 이름표 변경 (dept_name -> name)
    description: item.description || "",
    createdAt: item.created_at, // created_at -> createdAt
    // 프론트 타입에 필요한 다른 필드가 있다면 여기서 기본값 설정
  }));
};

// 부서 생성
export const createDepartment = async (deptName: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/dept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dept_name: deptName }),
  });

  if (!response.ok) throw new Error("부서 생성 실패");
  return response.json();
};

// 부서 수정
export const updateDepartment = async (
  deptId: number,
  deptName: string
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/dept${deptId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dept_name: deptName }),
  });

  if (!response.ok) throw new Error("부서 수정 실패");
  return response.json();
};

// 부서 삭제
export const deleteDepartmentAPI = async (deptId: number): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/dept${deptId}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("부서 삭제 실패");
  return response.json();
};

// --------------------------------------------------------------------------
// 2. 프로젝트 (Project) API
// --------------------------------------------------------------------------

// 프로젝트 목록 조회
export const fetchProjects = async (): Promise<Project[]> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/project`);
  if (!response.ok) throw new Error("프로젝트 목록을 불러오는데 실패했습니다.");

  const data: BackendProject[] = await response.json(); // ✨ 타입 명시

  // 변환: BackendProject -> Project
  return data.map((item) => ({
    id: item.project_id,
    name: item.project_name, // project_name -> name
    departmentId: item.dept_id, // dept_id -> departmentId
    description: item.description || "",
    status: item.status || "ACTIVE",
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
};

// 프로젝트 생성
export const createProject = async (
  projectName: string,
  deptId: number
): Promise<string> => {
  const body = {
    project_name: projectName,
    dept_id: deptId,
  };

  const response = await fetch(`${API_BASE_URL}/api/v1/project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error("프로젝트 생성 실패");
  return response.json();
};

// 프로젝트 수정
export const updateProject = async (
  projectId: number,
  projectName: string
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/project${projectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_name: projectName }),
  });

  if (!response.ok) throw new Error("프로젝트 수정 실패");
  return response.json();
};

// 프로젝트 삭제
export const deleteProjectAPI = async (projectId: number): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/project${projectId}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("프로젝트 삭제 실패");
  return response.json();
};
