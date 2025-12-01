// src/types/UserType.ts

// =============================================================================
// 1. Enums & Types (DB의 ENUM 컬럼과 1:1 매칭)
// =============================================================================

/** 사용자 권한 (DB: role) */
export type UserRole = "SUPER_ADMIN" | "MANAGER" | "USER";

/** 프로젝트 상태 (DB: status) */
export type ProjectStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

/** 문서 카테고리 (DB: category) */
export type DocumentCategory =
  | "CONTRACT" // 계약서
  | "OFFICIAL" // 공문
  | "REGULATION" // 사내규정
  | "REPORT" // 보고서
  | "MANUAL" // 매뉴얼
  | "PROPOSAL" // 기획/제안서
  | "GENERAL"; // 기타/일반

/** 문서 처리 상태 (DB: status) */
export type DocumentStatus =
  | "PARSED" // (완료)
  | "FAILED" // 실패
  | "PENDING" // 보류
  | "PROCESSING" // 처리중
  | "REJECTED"; // 거부

// =============================================================================
// 2. Interfaces (DB 테이블 구조 반영)
// =============================================================================

/** * 부서 정보
 * Table: departments
 */
export interface Department {
  id: number;
  dept_name: string; // 부서명
  description?: string; // 부서 설명 (NULL 가능)
  createdAt: string; // 생성일 (ISO Date string)
}

/** * 프로젝트 정보
 * Table: projects
 */
export interface Project {
  id: number;
  departmentId: number; // 소속 부서 ID (FK: departmentId)
  name: string; // 프로젝트명
  description?: string; // 프로젝트 설명
  startDate?: string; // 시작일 (YYYY-MM-DD)
  endDate?: string; // 종료일 (YYYY-MM-DD)
  status: ProjectStatus; // 상태 (ACTIVE, COMPLETED, ARCHIVED)
  createdAt: string;
  updatedAt: string;
}

/** * 사용자 정보
 * Table: users
 */
export interface User {
  id: number;
  accountId: string; // 로그인 ID
  userName: string; // 사용자 이름
  employeeId?: string; // 사번 (NULL 가능)
  profileImagePath?: string; // 프로필 이미지 URL (NULL 가능)

  departmentId: number; // 소속 부서 ID (FK: departmentId)
  projectId?: number; // 소속 프로젝트 ID (FK: project_id, 일반 유저용)

  role: UserRole; // 권한 (SUPER_ADMIN, MANAGER, USER)

  lastLoginAt?: string; // 마지막 로그인 시간
  isActive: boolean; // 계정 활성 여부 (TINYINT(1) -> boolean)

  createdAt: string;
  updatedAt: string;
}

/** * 문서 정보
 * Table: documents
 */
export interface Document {
  id: number;
  title: string;
  content: string;

  // 관계 정보
  userId: number; // 업로더 ID (FK)
  departmentId: number; // 소속 부서 ID (FK)
  projectId: number; // 소속 프로젝트 ID (FK)

  // 파일 정보
  originalFilename: string; // 원본 파일명
  storedPath: string; // 저장 경로
  fileExt: string; // 확장자
  fileSize?: number; // 파일 크기

  // 메타데이터 & AI 정보
  category: DocumentCategory; // 카테고리
  fileHash?: string; // SHA256 해시
  vectorId?: string; // ChromaDB ID
  summary?: string; // AI 3줄 요약
  tokenCount?: number; // 토큰 수

  // 상태 관리
  status: DocumentStatus; // 처리 상태
  errorMessage?: string; // 에러 메시지
  version: string; // 버전 (기본 1.0)

  // 삭제 관리 (휴지통)
  deletedAt?: string; // 삭제 요청 시간 (있으면 휴지통)
  restoreDeadline?: string; // 복구 마감일

  createdAt: string;
  updatedAt: string;
}

/** * 채팅 세션 정보 (사이드바용)
 * Table: chat_sessions
 */
export interface ChatSession {
  id: number;
  userId: number; // 채팅방 주인 ID (FK)
  title: string; // 채팅방 제목
  isDeleted: boolean; // 삭제 여부
  createdAt: string;
  updatedAt: string;
}

export type RequestType = "CREATE" | "UPDATE" | "DELETE";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

// 실제 API 응답 구조 반영
export interface RequestItem {
  id: number;
  requester_id: number;
  project_id: number;
  target_document_id: number | null;
  request_type: RequestType;
  status: RequestStatus;
  content: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;

  // 추가된 필드
  user_name: string; // 요청자 이름
  celery_task_id?: string;
  error_message?: string;

  // 아직 백엔드에서 안 주지만, 나중을 위해 남겨둠 (화면엔 ID로 표시됨)
  project_name?: string;
  document_name?: string;
}
