// src/constants/projectConstants.ts

import type { DocumentCategory, DocumentStatus } from "@/types/UserType";

// 1. 필터링용 옵션 목록
export const STATUS_FILTERS: DocumentStatus[] = [
  "UPLOADED",
  "PARSING",
  "EMBEDDING",
  "COMPLETED",
  "FAILED",
];

export const CATEGORY_FILTERS: DocumentCategory[] = [
  "CONTRACT",
  "OFFICIAL",
  "REGULATION",
  "REPORT",
  "MANUAL",
  "PROPOSAL",
  "GENERAL",
];

// 2. 카테고리 한글 매핑 (UI 표시용)
export const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  CONTRACT: "계약서",
  OFFICIAL: "공문",
  REGULATION: "사내규정",
  REPORT: "보고서",
  MANUAL: "매뉴얼",
  PROPOSAL: "기획/제안서",
  GENERAL: "일반/기타",
};

// 3. 카테고리 뱃지 색상 스타일
export const CATEGORY_COLOR: Record<DocumentCategory, string> = {
  CONTRACT: "text-amber-700 bg-amber-50 border-amber-200",
  OFFICIAL: "text-slate-700 bg-slate-100 border-slate-200",
  REPORT: "text-indigo-700 bg-indigo-50 border-indigo-200",
  PROPOSAL: "text-pink-700 bg-pink-50 border-pink-200",
  GENERAL: "text-gray-600 bg-gray-50 border-gray-200",
  MANUAL: "text-emerald-700 bg-emerald-50 border-emerald-200",
  REGULATION: "text-blue-700 bg-blue-50 border-blue-200",
};

// 4. 상태(Status) 뱃지 설정
export const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; color: string; dot: string }
> = {
  UPLOADED: {
    label: "업로드됨",
    color: "text-gray-600 bg-gray-100",
    dot: "bg-gray-400",
  },
  PARSING: {
    label: "처리 중",
    color: "text-blue-600 bg-blue-100",
    dot: "bg-blue-400 animate-pulse",
  },
  EMBEDDING: {
    label: "AI 분석 중",
    color: "text-purple-600 bg-purple-100",
    dot: "bg-purple-400 animate-pulse",
  },
  COMPLETED: {
    label: "완료",
    color: "text-green-600 bg-green-100",
    dot: "bg-green-500",
  },
  FAILED: {
    label: "실패",
    color: "text-red-600 bg-red-100",
    dot: "bg-red-500",
  },
};
