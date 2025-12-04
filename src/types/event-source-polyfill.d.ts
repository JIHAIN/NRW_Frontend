declare module "event-source-polyfill" {
  export interface EventSourcePolyfillInit {
    headers?: Record<string, string>;
    withCredentials?: boolean;
    heartbeatTimeout?: number;
  }

  export class EventSourcePolyfill extends EventTarget {
    constructor(url: string, eventSourceInitDict?: EventSourcePolyfillInit);

    // [수정] 반환 타입을 any -> void 로 변경
    onopen: ((this: EventSourcePolyfill, ev: Event) => void) | null;
    onmessage: ((this: EventSourcePolyfill, ev: MessageEvent) => void) | null;
    onerror: ((this: EventSourcePolyfill, ev: Event) => void) | null;

    close(): void;
    url: string;
    readyState: number;

    static CONNECTING: number;
    static OPEN: number;
    static CLOSED: number;
  }
}
