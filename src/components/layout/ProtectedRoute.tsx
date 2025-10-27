// src/components/layout/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
// import { useAuth } from "../../hooks/useAuth"; // 로그인 상태를 가져오는 훅

const ProtectedRoute = () => {
  //   const { isAuthenticated, isLoading } = useAuth(); // 사용자 정보를 확인

  //   if (isLoading) {
  //     // 로딩 중일 때 로딩 스피너를 보여줄 수 있습니다.
  //     return <div>로딩 중...</div>;
  //   }

  //   if (!isAuthenticated) {
  //     // 로그인되지 않았다면 로그인 페이지로 리다이렉트
  //     return <Navigate to="/auth/signin" replace />;
  //   }

  // 🌟 로그인되었다면, 중첩된 하위 라우트(Outlet)를 렌더링
  return <Outlet />;
};

export default ProtectedRoute;
