/** 부서 항목의 타입을 정의. */
export interface Department {
  id: number;
  name: string;
}

/** 프로젝트 항목의 타입을 정의. */
export interface Project {
  id: number;
  name: string;
  departmentId: number; // 어느 부서 소속인지
  creationDate: string;
}

/** 사용자 권한 타입을 정의합니다. */
export type UserRole = "총괄 관리자" | "관리자" | "일반 사용자";

/** 사용자 항목의 타입을 정의합니다. */
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  // 부서 관리자일 경우 관리하는 부서 ID 목록 (여러 개일 수 있음)
  managedDepartmentIds: number[];
  // 일반 사용자일 경우 소속 부서 ID (하나만)
  departmentId: number;
  // 일반 사용자일 경우 소속 프로젝트 ID 목록
  projectIds: number[];
}

/** 문서(테이블 목록) 항목의 타입을 정의합니다. */
export interface Document {
  id: number;
  name: string;
  location: string; // 문서 위치
  created: string; // 생성 일자
  status: "완료" | "진행 중" | "보류";
  completed: string; // 완료 일자
  projectId: number; // 소속 프로젝트 ID (추가하여 관리 페이지와 연계)
}
