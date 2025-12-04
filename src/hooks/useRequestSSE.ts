import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { EventSourcePolyfill } from "event-source-polyfill";

interface SSEData {
  status?: string;
  error?: string;
  [key: string]: unknown;
}

export function useRequestSSE(requestId: number | null) {
  const [data, setData] = useState<SSEData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // User 객체에서 토큰 안전하게 가져오기
  const user = useAuthStore((state) => state.user);
  const token = user && "token" in user ? (user.token as string) : null;

  const eventSourceRef = useRef<EventSourcePolyfill | null>(null);

  useEffect(() => {
    if (!requestId || !token) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSourcePolyfill(
      `/api/v1/events/request/${requestId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        heartbeatTimeout: 86400000,
      }
    );

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("SSE 연결 성공!");
      setIsConnected(true);
    };

    // [수정] event 타입을 MessageEvent로 명시
    eventSource.onmessage = (event: MessageEvent) => {
      try {
        // event.data는 기본적으로 string입니다.
        const parsedData = JSON.parse(event.data as string) as SSEData;

        console.log("SSE 수신:", parsedData);
        setData(parsedData);

        if (parsedData.status === "DONE" || parsedData.status === "FAILED") {
          eventSource.close();
          setIsConnected(false);
        }
      } catch (error) {
        console.error("데이터 파싱 오류:", error);
      }
    };

    // [수정] err 타입을 Event로 명시
    eventSource.onerror = (err: Event) => {
      console.error("SSE 에러:", err);
      eventSource.close();
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [requestId, token]);

  return { data, isConnected };
}
