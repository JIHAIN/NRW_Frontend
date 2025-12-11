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
  // [핵심] 연속된 빈 줄 횟수를 카운트하는 변수
  let emptyLineCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    // 줄바꿈 문자로 전체를 쪼갭니다 (서버가 보내는 물리적인 줄바꿈)
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      // 1. 데이터 라인인지 확인
      if (line.startsWith("data:")) {
        // 내용 추출
        let rawContent = line.slice(5);
        if (rawContent.startsWith(" ")) {
          rawContent = rawContent.slice(1);
        }

        // 종료 신호
        if (rawContent.trim() === "[DONE]" || rawContent.trim() === "END") {
          continue;
        }

        // 2. 내용이 비어있는지 확인
        // 주의: trim()을 해서 비어있다면, 화면상에 보이지 않는 공백문자만 있거나 아예 없는 경우
        if (!rawContent || rawContent.trim() === "") {
          // 빈 줄 카운트 증가
          emptyLineCount++;
        } else {
          // 3. 내용이 있는 경우 (글자 도착)
          // 이전에 쌓여있던 빈 줄들을 처리하고, 현재 글자를 보냄

          // [규칙 적용]
          if (emptyLineCount === 0 || emptyLineCount === 1) {
            // 0개: 그냥 씀
            // 1개: 무시 (글자 사이 끊김 연결)
          } else if (emptyLineCount === 2) {
            // 2개 연속 빈 줄 -> 줄바꿈 1번
            onDelta("\n");
          } else if (emptyLineCount >= 3) {
            // 3개 이상 연속 빈 줄 -> 문단 바꿈
            onDelta("\n\n");
          }

          // 빈 줄 카운트 리셋
          emptyLineCount = 0;

          // 실제 텍스트 전송
          // 혹시 모를 JSON 체크
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
      // data: 가 아닌 완전 빈 줄도 카운트에 포함 (안전장치)
      else if (line.trim() === "") {
        emptyLineCount++;
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

/**
 * 7. [추가] 채팅 세션 제목 수정
 * PUT /api/v1/chat/sessions/{session_id}
 */
export const updateChatSessionTitle = async (
  sessionId: number | string,
  title: string
): Promise<string> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/chat/sessions/${sessionId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }
  );

  if (!response.ok) throw new Error("제목 수정 실패");
  return response.json();
};
