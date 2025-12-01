// 예시: UI 표시용 맵핑 객체

import type {
  DocumentCategory,
  DocumentStatus,
  UserRole,
} from "../types/UserType";

export const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "총괄 관리자",
  MANAGER: "관리자(부서장)",
  USER: "일반 사용자",
};

export const DOC_CATEGORY_LABEL: Record<DocumentCategory, string> = {
  CONTRACT: "계약서",
  OFFICIAL: "공문",
  REGULATION: "사내규정",
  REPORT: "보고서",
  MANUAL: "매뉴얼",
  PROPOSAL: "기획/제안서",
  GENERAL: "일반/기타",
};

export const DOC_STATUS_LABEL: Record<DocumentStatus, string> = {
  UPLOADED: "업로드 완료",
  PARSING: "텍스트 추출 중...",
  EMBEDDING: "AI 분석 중...",
  COMPLETED: "처리 완료",
  PARSED: "파싱 완료",
  FAILED: "처리 실패",
};
