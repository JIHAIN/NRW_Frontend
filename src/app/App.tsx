import { useEffect } from "react"; // 리다이렉트용 (필요시)
import { useNavigate, useLocation } from "react-router-dom"; // 리다이렉트용
import AppRoutes from "./routes";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/Sidebar/AppSidebar";
import { TestAuthPanel } from "@/components/common/TestAuthPanel";
import { UploadStatusBox } from "@/pages/project/components/modal/UploadStatusBox";
import Header from "@/components/layout/Header";

// ▼ AuthStore 가져오기
import { useAuthStore } from "@/store/authStore";
import { GlobalDialog } from "@/components/ui/GlobalDialog";

function App() {
  // 1. 로그인 상태 가져오기
  const { isAuthenticated } = useAuthStore();

  // (선택 사항) App.tsx에서 강제 리다이렉트까지 처리하고 싶다면 아래 주석 해제

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 로그인이 안 되어 있고, 현재 페이지가 메인("/")이나 로그인("/login")이 아니면
    if (
      !isAuthenticated &&
      location.pathname !== "/" &&
      location.pathname !== "/login"
    ) {
      navigate("/"); // 메인으로 쫓아냄
    }
  }, [isAuthenticated, location, navigate]);

  return (
    <SidebarProvider>
      <div className="relative h-screen w-screen flex flex-1 overflow-hidden bg-white">
        {/* 배경 패턴 (기존 동일) */}
        <div
          className="absolute inset-0 z-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2394a3b8' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-1 w-full h-full">
          {/* ▼ 2. 로그인 상태일 때만 사이드바 렌더링 */}
          {isAuthenticated && (
            <AppSidebar className="bg-slate-50/80 backdrop-blur-sm" />
          )}

          <div className="w-full flex flex-col ">
            <Header />
            <main className="flex-1 overflow-hidden">
              <div className="mx-auto w-full h-full overflow-hidden">
                <AppRoutes />
              </div>
            </main>
            <GlobalDialog />

            {/* 로그인 상태일 때만 업로드 상태창도 보여주는게 좋음 */}
            {isAuthenticated && <UploadStatusBox />}

            <TestAuthPanel />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default App;
