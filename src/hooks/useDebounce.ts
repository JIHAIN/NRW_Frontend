import { useState, useEffect } from "react";

/**
 * 디바운스 기능을 제공하는 커스텀 훅
 * 값이 변경된 후 일정 시간(delay) 동안 추가 변경이 없을 때만 값을 업데이트합니다.
 * @param value 디바운스할 값
 * @param delay 지연 시간 (밀리초)
 * @returns 디바운스된 값
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // delay 이후에 debouncedValue를 업데이트합니다.
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // cleanup 함수: value나 delay가 바뀌면 이전 타이머를 취소합니다.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
