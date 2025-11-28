import { API_BASE_URL } from "@/lib/constants";

export interface CreateRequestDto {
  requester_id: number;
  project_id: number;
  request_type: string;
  target_document_id: number;
  content: string;
}

/**
 * 관리자에게 요청 보내기
 * POST /api/v1/requests/
 */
export const createRequest = async (
  data: CreateRequestDto
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/requests/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("요청 전송 실패");
  return response.json();
};
