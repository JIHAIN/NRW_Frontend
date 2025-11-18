import { API_BASE_URL } from "@/lib/constants";

export interface ChatRequest {
  conversation_id: string;
  message: string;
}

interface ChatResponse {
  answer: string; // AI 답변
  sources: string[]; // 추가: 참고한 문서 목록 (예: ["규정집.pdf"])
  context_used: string; // 추가: 참고한 문맥 (예: "제 5조 2항에 따르면...")
}

export const sendMessage = async (data: ChatRequest): Promise<ChatResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error(`API Error: ${response.status}`);

  return await response.json(); // { answer, sources, context_used }
};
