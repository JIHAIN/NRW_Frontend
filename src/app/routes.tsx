// src/app/routes.tsx

import { Routes, Route } from "react-router-dom";
import AuthPage from "@/pages/auth/loginSignup";
import MainHome from "@/pages";
import DashBoard from "@/pages/dashboard/DashBoardPage";

import UploadPage from "@/pages/upload/UploadPage";
import NotebookLikePage from "@/pages/notebook_like/notebook";
import ProjectPage from "@/pages/project/ProjectPage";
import { UserManagementPage } from "@/pages/admin/UserManagementPage";
import { ManagePage } from "@/pages/Manage/ManagePage";
// import ProtectedRoute from '../components/layout/ProtectedRoute'; // 가정
// import Header from '../components/layout/Header'; // 가정
// import Footer from '../components/layout/Footer'; // 가정

// 페이지 컴포넌트 임포트
// import SignInPage from '../pages/auth/SignIn';
// import ChatPage from '../pages/chat/ChatPage';
// import UploadPage from '../pages/upload/UploadPage';
// import NotFound from '../pages/NotFound';

// Route 정의를 함수로 분리하여 내보냄
const AppRoutes = () => (
  <Routes>
    {/* 0. 홈 화면 라우트 */}
    <Route path="/" element={<MainHome />} />
    {/* 1. 인증 관련 라우트 */}
    <Route path="/auth/login_signup" element={<AuthPage />} />
    {/* <Route path="/auth/signup" element={<div><Header/>SignUp<Footer/></div>} /> */}
    {/* ... 다른 auth 페이지 ... */}
    {/* 2. 보호된 라우트 그룹 (로그인 필요) */}
    {/* ProtectedRoute를 Routes 밖이 아닌 Route element 내부에 컴포넌트로 활용 */}
    {/* <Route 
        path="/" 
        element={<ProtectedRoute />} // 👈 보호된 루트 컴포넌트로 활용
    >
        {/*보호된 경로들*/}
    <Route path="/note" element={<NotebookLikePage />} />
    <Route path="/dashboard" element={<DashBoard />} />

    <Route path="/upload" element={<UploadPage />} />
    <Route path="/Docs" element={<ProjectPage />} />
    <Route path="/User" element={<UserManagementPage />} />
    <Route path="/Manage" element={<ManagePage />} />

    {/*  <Route path="/upload" element={<UploadPage />} /> */}
    {/*  <Route index element={<ChatPage />} /> */}
    {/* 3. 404 Not Found (모든 일치하지 않는 경로) */}
    {/* <Route path="*" element={<NotFound />} /> */}
  </Routes>
);

export default AppRoutes;
