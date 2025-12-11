import { API_BASE_URL } from "@/lib/constants";

// --------------------------------------------------------------------------
// 📝 타입 정의 (Swagger 명세 반영)
// --------------------------------------------------------------------------

// 1. 채팅방(세션) 정보
export interface ChatSession {
  id: number;
  user_id: number;
  title: string;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

// 2. 채팅 메시지 내역
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// 3. 세션 상세 조회 응답
export interface SessionDetailResponse {
  session: ChatSession;
  messages: ChatMessage[];
}

// 4. 채팅방 생성 요청
export interface CreateSessionRequest {
  user_id: number;
  title: string;
}

// [NEW] 채팅방 생성 응답 DTO
interface CreateSessionResponse {
  session_id: number;
  user_id: number;
  title: string;
}

// 5. 메시지 전송 요청
export interface SendMessageRequest {
  conversation_id: string; // 백엔드 명세에 맞춤
  message: string;
  user_id: number;
}

// --------------------------------------------------------------------------
// 🚀 API 함수 모음
// --------------------------------------------------------------------------

/**
 * 1. 채팅 세션(대화방) 생성
 * POST /api/v1/chat/sessions/ (슬래시 있음)
 */
export const createChatSession = async (
  data: CreateSessionRequest
): Promise<string> => {
  // 슬래시 필수 확인
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`세션 생성 실패 (${response.status}):`, errText);
    throw new Error(`세션 생성 실패: ${response.status}`);
  }

  // [수정 유지] JSON 파싱 후 session_id만 추출하여 문자열로 반환
  // 이게 안 되면 conversation_id가 "[object Object]"가 되어 422 에러 발생함
  try {
    const resData: CreateSessionResponse = await response.json();
    return String(resData.session_id);
  } catch (e) {
    // 혹시라도 텍스트로 오면 그대로 반환
    const text = await response.text();
    console.error(e);
    return text;
  }
};

/**
 * 2. 채팅 세션 목록 조회
 */
export const getChatSessions = async (
  userId: number
): Promise<ChatSession[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/chat/sessions/?user_id=${userId}`
  );

  if (!response.ok) throw new Error(`목록 조회 실패: ${response.status}`);

  return response.json();
};

/**
 * 3. 특정 세션의 대화 내용 가져오기
 */
export const getChatSessionDetail = async (
  sessionId: number | string
): Promise<SessionDetailResponse> => {
  // [방어 코드]
  if (!sessionId || sessionId.toString() === "[object Object]") {
    throw new Error("유효하지 않은 세션 ID입니다.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/chat/sessions/${sessionId}`
  );

  if (!response.ok) throw new Error(`대화 내용 로드 실패: ${response.status}`);

  return response.json();
};

/**
 * 4. 메시지 전송 (단건)
 * POST /api/v1/chat/
 */
export const sendChatMessage = async (
  data: SendMessageRequest
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error(`메시지 전송 실패: ${response.status}`);

  return response.json();
};

/**
 * 5. [수정] 채팅 스트리밍 API (줄바꿈/공백 완벽 대응)
 */
export const streamChatResponse = async (
  data: SendMessageRequest,
  onDelta: (token: string) => void
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok || !response.body) {
    throw new Error(`스트리밍 요청 실패: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    // 줄바꿈 기준으로 청크 분리
    const lines = buffer.split("\n");
    // 마지막 조각은 다음 데이터와 합치기 위해 남겨둠
    buffer = lines.pop() || "";

    for (const line of lines) {
      // SSE 데이터 포맷인지 확인
      if (line.startsWith("data:")) {
        // "data:" 뒤의 문자열 추출 (index 5부터)
        let rawContent = line.slice(5);

        // [SSE 표준] "data: " 처럼 공백이 하나 있으면 제거
        if (rawContent.startsWith(" ")) {
          rawContent = rawContent.slice(1);
        }

        // 종료 신호 체크
        if (rawContent.trim() === "[DONE]" || rawContent.trim() === "END")
          continue;

        // [핵심 해결책]
        // 내용이 빈 문자열("")이라면, 이는 서버가 보낸 '줄바꿈' 신호입니다.
        if (rawContent === "") {
          onDelta("\n"); // 강제로 줄바꿈 문자 주입
        } else {
          // 내용이 있으면 그대로 전송 (띄어쓰기 등은 이미 rawContent에 포함됨)
          // 혹시 모를 JSON 포맷 대응
          if (rawContent.startsWith("{")) {
            try {
              const parsed = JSON.parse(rawContent);
              onDelta(parsed.content || "");
            } catch {
              onDelta(rawContent);
            }
          } else {
            onDelta(rawContent);
          }
        }
      }
    }
  }
};

/**
 * 6. 채팅 세션 삭제
 */
export const deleteChatSession = async (
  sessionId: number | string
): Promise<string> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/chat/sessions/${sessionId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) throw new Error(`세션 삭제 실패: ${response.status}`);

  return response.json();
};
