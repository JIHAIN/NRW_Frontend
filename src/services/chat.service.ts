import { API_BASE_URL } from "@/lib/constants";

// --------------------------------------------------------------------------
// 📝 타입 정의 (Swagger 명세 및 메타데이터 반영)
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
  // [추가] 출처 및 근거 데이터 필드
  sources?: string[]; // 예: ["주차장관리지침.hwpx", "복무규정.hwp"]
  contextUsed?: string; // 예: "[주차장관리지침] ... 주차장 명칭 및 구역 ..." (하이라이트용 원문)
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

// 채팅방 생성 응답 DTO
interface CreateSessionResponse {
  session_id: number;
  user_id: number;
  title: string;
}

// 5. 메시지 전송 요청
export interface SendMessageRequest {
  conversation_id: string;
  message: string;
  user_id: number;
}

// [NEW] 메타데이터 내 소스 정보 타입
export interface SourceItem {
  index: number;
  doc_name: string;
  doc_id: number;
  chunk_id: number;
  score: number;
  type?: string | null;
  table_id?: string | null;
}

// [NEW] 스트림 메타데이터 전체 타입
export interface ChatMetadata {
  answer?: string;
  sources?: SourceItem[];
  context_used?: string;
  // 추후 확장 가능성을 위해 인덱스 시그니처 허용 (선택사항)
  // [key: string]: unknown;
}

// --------------------------------------------------------------------------
// 🚀 API 함수 모음
// --------------------------------------------------------------------------

/**
 * 1. 채팅 세션(대화방) 생성
 * POST /api/v1/chat/sessions/
 */
export const createChatSession = async (
  data: CreateSessionRequest
): Promise<string> => {
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

  try {
    const resData: CreateSessionResponse = await response.json();
    return String(resData.session_id);
  } catch (e) {
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
 * 5. [수정] 채팅 스트리밍 API
 * - data: 라인의 불필요한 공백 제거 로직 개선
 * - 물리적인 빈 줄만 줄바꿈 카운트로 인식
 * - 메타데이터 타입(any 제거) 적용
 */
export const streamChatResponse = async (
  data: SendMessageRequest,
  onDelta: (token: string) => void,
  // [수정] any 대신 ChatMetadata 타입 사용
  onMetadata?: (metadata: ChatMetadata) => void
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
  let emptyLineCount = 0; // 물리적인 빈 줄(엔터) 카운트
  let currentEvent = "message"; // 현재 처리 중인 이벤트 타입

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      // 1. 이벤트 타입 체크 (event: metadata 등)
      if (line.startsWith("event:")) {
        currentEvent = line.slice(6).trim();
        continue;
      }

      // 2. 데이터 라인 처리
      if (line.startsWith("data:")) {
        // [핵심] 이전에 쌓인 물리적 빈 줄 처리 (data: 라인이 오면 이전 빈줄 정산)
        if (emptyLineCount > 0) {
          if (emptyLineCount >= 3) {
            onDelta("\n\n"); // 3줄 이상 -> 문단 바꿈
          } else if (emptyLineCount === 2) {
            onDelta("\n"); // 2줄 -> 줄바꿈
          }
          // 1줄은 무시 (연결된 문장으로 취급하여 공백 없이 붙임)
          emptyLineCount = 0;
        }

        let rawContent = line.slice(5);

        // 앞쪽 공백 1칸은 SSE 프로토콜상 분리자일 수 있으므로 제거
        if (rawContent.startsWith(" ")) {
          rawContent = rawContent.slice(1);
        }

        // 종료 신호 체크
        if (rawContent.trim() === "[DONE]" || rawContent.trim() === "END") {
          continue;
        }

        // [Metadata 처리]
        if (currentEvent === "metadata") {
          try {
            const parsedMeta = JSON.parse(rawContent) as ChatMetadata;
            if (onMetadata) onMetadata(parsedMeta);
          } catch (e) {
            console.error("메타데이터 파싱 실패", e);
          }
          currentEvent = "message"; // 다시 기본 상태로 복귀
          continue;
        }

        // [텍스트 처리]
        // data: 로 들어온 내용은 공백이 포함되어 있어도(스페이스 2개 등) 텍스트로 간주
        // 빈 줄 카운트를 증가시키지 않고 바로 전송
        if (rawContent.startsWith("{") && rawContent.endsWith("}")) {
          try {
            // 혹시 JSON 형태의 문자열이 올 경우 방어 로직
            const parsed = JSON.parse(rawContent);
            onDelta(parsed.content || "");
          } catch {
            onDelta(rawContent);
          }
        } else {
          onDelta(rawContent);
        }
      }
      // 3. 물리적인 빈 줄 처리 (data: 로 시작하지 않는 진짜 빈 줄)
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
 * 7. 채팅 세션 제목 수정
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
