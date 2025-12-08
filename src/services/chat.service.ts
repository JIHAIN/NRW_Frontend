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
  role: "user" | "assistant" | "system"; // 보통 이런 role을 가짐
  content: string;
}

// 3. 세션 상세 조회 응답 (세션정보 + 메시지들)
export interface SessionDetailResponse {
  session: ChatSession;
  messages: ChatMessage[];
}

// 4. 채팅방 생성 요청
export interface CreateSessionRequest {
  user_id: number;
  title: string;
}

// 5. 메시지 전송 요청
export interface SendMessageRequest {
  conversation_id: string; // 명세서상 string (세션 ID를 문자로 변환해서 보낼 듯)
  message: string;
  user_id: number;
}

// --------------------------------------------------------------------------
// 🚀 API 함수 모음
// --------------------------------------------------------------------------

// [추가] 스트리밍 전용 함수
// onDelta: 글자가 들어올 때마다 실행될 콜백 함수
export const sendChatMessageStream = async (
  data: SendMessageRequest,
  onDelta: (token: string) => void
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // 만약 백엔드가 SSE라면 Accept 헤더 추가 필요할 수 있음
      Accept: "text/event-stream",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok || !response.body) {
    throw new Error(`스트리밍 요청 실패: ${response.status}`);
  }

  // 1. 스트림 리더 생성
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  // 2. 무한 루프로 데이터 읽기
  while (true) {
    const { done, value } = await reader.read();
    if (done) break; // 스트림 끝

    // 3. 바이트 데이터를 문자로 변환
    const chunk = decoder.decode(value, { stream: true });

    // *중요*: 백엔드가 "data: { ... }" 형태의 SSE로 주는지, 순수 텍스트로 주는지에 따라 파싱 로직이 다를 수 있습니다.
    // 여기서는 순수 텍스트(글자 그대로)가 날아온다고 가정합니다.
    onDelta(chunk);
  }
};

/**
 * 1. 채팅 세션(대화방) 생성
 * POST /api/v1/chat/sessions/
 */
export const createChatSession = async (
  data: CreateSessionRequest
): Promise<string> => {
  // 1. URL 끝에 슬래시(/) 확인
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/sessions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error(`세션 생성 실패: ${response.status}`);

  // 2. ✨ 안전한 응답 처리 (JSON이 아닐 경우를 대비)
  const text = await response.text();
  try {
    // JSON 파싱 시도 (예: "session_123" 따옴표 있는 경우)
    return JSON.parse(text);
  } catch {
    // 파싱 실패하면 그냥 텍스트 그대로 반환 (예: session_123 따옴표 없는 경우)
    return text;
  }
};

/**
 * 2. 채팅 세션 목록 조회
 * GET /api/v1/chat/sessions/?user_id={user_id}
 *  중요: 쿼리 파라미터 방식
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
 * GET /api/v1/chat/sessions/{session_id}
 */
export const getChatSessionDetail = async (
  sessionId: number | string
): Promise<SessionDetailResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/chat/sessions/${sessionId}`
  );

  if (!response.ok) throw new Error(`대화 내용 로드 실패: ${response.status}`);

  return response.json();
};

/**
 * 4. 메시지 전송 (질문하기)
 * POST /api/v1/chat/
 *  중요: 명세서상 응답이 객체가 아니라 단순 "string"입니다.
 */
export const sendChatMessage = async (
  data: SendMessageRequest
): Promise<string> => {
  // 명세서에 따라 끝에 슬래시(/) 포함
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error(`메시지 전송 실패: ${response.status}`);

  return response.json();
};

/**
 * [NEW] 채팅 스트리밍 API (POST 방식)
 * POST /api/v1/chat/stream
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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });

    // 1. SSE 데이터는 줄바꿈(\n)으로 구분되어 들어옵니다.
    const lines = chunk.split("\n");

    for (const line of lines) {
      // 2. "data:" 로 시작하는 줄만 처리
      if (line.startsWith("data:")) {
        // "data:" 부분 제거 (앞의 5글자)
        let raw = line.slice(5);

        // 3. [중요] 종료 신호 처리
        if (raw.trim() === "END" || raw.trim() === "[DONE]") continue;

        // 4. 데이터 파싱 시작
        let content = "";

        try {
          // 4-1. 혹시 JSON 포맷("안녕")으로 왔는지 시도
          // JSON.parse를 하면 "\n"(글자)이 실제 줄바꿈으로 자동 변환됩니다.
          const parsed = JSON.parse(raw);
          content = typeof parsed === "string" ? parsed : parsed.content || "";
        } catch {
          // 4-2. JSON이 아니라면 순수 텍스트 로직 (백엔드가 data: 안녕 이렇게 보낼 때)

          // 앞쪽의 프로토콜용 공백 1칸만 제거 (trim 절대 금지!)
          if (raw.startsWith(" ")) {
            raw = raw.slice(1);
          }

          // [핵심 해결책] 글자 "\n"을 실제 줄바꿈(Enter)으로 강제 변환
          // g 옵션은 "모두 다 바꿔라"는 뜻입니다.
          content = raw.replace(/\\n/g, "\n");
        }

        // 5. 빈 내용이 아니면 전송 (줄바꿈만 있는 경우도 전송해야 함)
        if (content) {
          onDelta(content);
        }
      }
    }
  }
};
/**
 * 5. 채팅 세션 삭제
 * DELETE /api/v1/chat/sessions/{session_id}
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
