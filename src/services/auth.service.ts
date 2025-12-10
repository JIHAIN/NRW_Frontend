import { API_BASE_URL } from "@/lib/constants";
import type { UserRole } from "@/types/UserType";

// --------------------------------------------------------------------------
// 타입 정의
// --------------------------------------------------------------------------

// 백엔드에서 내려주는 User 객체 구조 (Snake Case)
export interface BackendUser {
  id: number;
  account_id: string;
  user_name: string;
  role: UserRole;
  dept_id: number | null;
  project_id: number | null;
  profile_image_path: string | null;
}

// 로그인 요청 데이터
export interface LoginRequest {
  account_id: string;
  password: string;
}

// 로그인 응답 데이터
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: BackendUser; // [수정] 정확한 백엔드 모델 타입 사용
}

// 토큰 재발급 요청
export interface RefreshRequest {
  refresh_token: string;
}

// 토큰 재발급 응답
export interface RefreshResponse {
  access_token: string;
  token_type: string;
}

// --------------------------------------------------------------------------
// API 함수
// --------------------------------------------------------------------------

/**
 * 로그인 API 호출
 * POST /api/v1/auth/login
 */
export const loginAPI = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    // 에러 응답 파싱 시도
    const errorData = await response.json().catch(() => ({}));
    // 상세 에러 메시지가 있으면 사용, 없으면 기본 메시지
    const detailMsg =
      errorData.detail && Array.isArray(errorData.detail)
        ? errorData.detail[0]?.msg
        : errorData.detail;

    throw new Error(detailMsg || "로그인에 실패했습니다.");
  }

  return response.json();
};

/**
 * Access Token 재발급 API 호출
 * POST /api/v1/auth/refresh
 */
export const refreshTokenAPI = async (
  refreshToken: string
): Promise<RefreshResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error("토큰 갱신 실패");
  }

  return response.json();
};
