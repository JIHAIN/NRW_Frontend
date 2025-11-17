// src/services/documents.service.ts

import { API_BASE_URL } from "@/lib/constants";

// 백엔드의 /api/v1/upload-and-parse/ 엔드포인트와 통신하는 함수
export const uploadDocument = async (
  file: File,
  metadata: {
    dept_id: string | null;
    project_id: string | null;
    user_id: string | null;
  }
) => {
  const formData = new FormData();
  formData.append("file", file);

  // FormData에 메타데이터 추가 (값이 있는 경우에만)
  if (metadata.dept_id) {
    formData.append("dept_id", metadata.dept_id);
  }
  if (metadata.project_id) {
    formData.append("project_id", metadata.project_id);
  }
  if (metadata.user_id) {
    formData.append("user_id", metadata.user_id);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/parsing/upload-and-parse/`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: "An unknown error occurred" }));
    throw new Error(
      errorData.detail || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
};
