// src/app/routes.tsx

import { Routes, Route, Navigate, Outlet } from "react-router-dom";
// import MainHome from "@/pages";
import ChatPage from "@/pages/chat/ChatPage";
import ProjectPage from "@/pages/project/ProjectPage";
import { UserManagementPage } from "@/pages/admin/UserManagementPage";
import { DeptProjectAdminPage } from "@/pages/admin/DeptProjectAdminPage";
import RequestAdminPage from "@/pages/admin/Request/RequestAdminPage";
import LandingPage from "@/pages/about";

import { useAuthStore } from "@/store/authStore";
import AuthPage from "@/pages/auth/loginSignup";

function ProtectedRoute() {
  const { isAuthenticated, user } = useAuthStore();

  // 로그인 안 했으면 메인("/")으로 리다이렉트
  if (!isAuthenticated || user?.role === "USER") {
    return <Navigate to="/" replace />;
  }

  // 로그인 했으면 자식 라우트(Outlet) 보여줌
  return <Outlet />;
}

// Route 정의를 함수로 분리하여 내보냄
const AppRoutes = () => (
  <Routes>
    {/* 0. 홈 화면 라우트 */}
    <Route path="/" element={<LandingPage />} />
    {/* 404 Not Found (모든 일치하지 않는 경로) */}
    <Route path="*" element={<LandingPage />} />

    {/* 1. 인증 관련 라우트 */}
    <Route path="/login" element={<AuthPage />} />

    {/* 일반 사용자도 사용가능 */}
    <Route path="/docs" element={<ProjectPage />} />
    <Route path="/chat" element={<ChatPage />} />

    {/* 3. 보호된 라우트 그룹 (로그인, 관리자급만 가능) */}
    <Route element={<ProtectedRoute />}>
      {/* <Route path="/admin/dashboard" element={<DashboardPage />} /> */}
      <Route path="/admin/user" element={<UserManagementPage />} />
      <Route path="/admin/project" element={<DeptProjectAdminPage />} />
      <Route path="/admin/request" element={<RequestAdminPage />} />
    </Route>
  </Routes>
);

export default AppRoutes;
