import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // 예시

const queryClient = new QueryClient({
  // 기본적으로 5분 동안 신선한 데이터를 유지해줌
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
    },
  },
});

const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {/* 테마 Provider 등 다른 전역 Provider를 여기에 추가합니다 */}
      {children}
    </QueryClientProvider>
  );
};

export default GlobalProvider;
