import { API_BASE_URL } from "@/lib/constants";
import type { User } from "@/types/UserType";

// 백엔드에서 내려주는 유저 데이터 형태
interface BackendUserResponse {
  id: number;
  account_id: string;
  user_name: string;
  employee_id: string | null;
  profile_image_path: string | null;
  dept_id: number | null;
  project_id: number | null;
  role: "SUPER_ADMIN" | "MANAGER" | "USER";
  last_login_at: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// 사용자 생성 요청 데이터 타입
export interface CreateUserRequest {
  account_id: string;
  password: string;
  user_name: string;
  dept_id: number;
  role: "MANAGER" | "USER";
}

// 사용자 수정 요청 데이터 타입
export interface UpdateUserRequest {
  user_name?: string;
  dept_id?: number;
  role?: string;
}

// 내 정보 수정 요청 타입
export interface UpdateMeRequest {
  payload: {
    user_name: string;
    nickname?: string;
  };
}

// 비밀번호 변경 요청 타입
export interface ChangePasswordRequest {
  payload: {
    old_password: string;
    new_password: string;
  };
}

// --------------------------------------------------------------------------
// API 함수들
// --------------------------------------------------------------------------

// 1. 사용자 목록 조회
export const fetchUsersAPI = async (): Promise<User[]> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/`);

  if (!response.ok) {
    throw new Error("사용자 목록 조회 실패");
  }

  const data = await response.json();

  return data.map((u: BackendUserResponse) => ({
    id: u.id,
    accountId: u.account_id,
    userName: u.user_name,
    role: u.role,
    departmentId: u.dept_id || 0,
    projectId: u.project_id || 0,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    isActive: u.is_active === 1,
    profileImagePath: u.profile_image_path,
    employeeId: u.employee_id, // [추가] 매핑
  }));
};

// 2. 단일 사용자 조회
export const fetchUserByIdAPI = async (userId: number): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}`);

  if (!response.ok) {
    throw new Error("사용자 상세 조회 실패");
  }

  const u: BackendUserResponse = await response.json();

  return {
    id: u.id,
    accountId: u.account_id,
    userName: u.user_name,
    role: u.role,
    departmentId: u.dept_id || 0,
    projectId: u.project_id || 0,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    isActive: u.is_active === 1,
    profileImagePath: u.profile_image_path || "",
    employeeId: u.employee_id || "", // [추가] 매핑
  };
};

// 3. 사용자 생성
export const createUser = async (
  userData: CreateUserRequest
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "사용자 생성 실패");
  }
};

// 4. 사용자 수정
export const updateUserAPI = async (
  userId: number,
  data: UpdateUserRequest
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("사용자 정보 수정 실패");
  }
};

// 5. 사용자 삭제
export const deleteUserAPI = async (userId: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("사용자 삭제 실패");
  }
};

// --------------------------------------------------------------------------
// 내 정보 관리 API
// --------------------------------------------------------------------------

/**
 * 내 정보 조회
 */
export const getMyInfoAPI = async (token: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("내 정보 조회 실패");

  const u: BackendUserResponse = await response.json();
  console.log(
    u.id,
    u.account_id,
    u.user_name,
    u.role,
    u.dept_id,
    u.project_id,
    u.created_at,
    u.updated_at,
    u.is_active,
    u.profile_image_path,
    u.employee_id
  );
  return {
    id: u.id,
    accountId: u.account_id,
    userName: u.user_name,
    role: u.role,
    departmentId: u.dept_id || 0,
    projectId: u.project_id || 0,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    isActive: u.is_active === 1,
    profileImagePath: u.profile_image_path || "",
    employeeId: u.employee_id || "",
  };
};

/**
 * 내 정보 수정
 */
export const updateMyInfoAPI = async (
  token: string,
  data: UpdateMeRequest
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("정보 수정 실패");
};

/**
 * 비밀번호 변경
 */
export const changePasswordAPI = async (
  token: string,
  data: ChangePasswordRequest
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/users/me/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("비밀번호 변경 실패");
};

/**
 * 프로필 이미지 업로드
 */
export const uploadProfileImageAPI = async (
  token: string,
  file: File
): Promise<void> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("current_user", "{}"); // 백엔드 요구사항 대응

  const response = await fetch(`${API_BASE_URL}/api/v1/users/me/profile`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) throw new Error("이미지 업로드 실패");
};
