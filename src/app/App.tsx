import AppRoutes from "./routes"; // 정의된 라우트 테이블 임포트
import GlobalProvider from "./providers"; // 전역 상태/쿼리 관리 Provider
import Header from "@/components/layout/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/Sidebar/navSidebar";

function App() {
  return (
    <GlobalProvider>
      <SidebarProvider>
        <div className="min-h-screen flex flex-1">
          <AppSidebar className="bg-slate-50" />
          <div className="w-full flex flex-col ">
            {/* 헤더 고정 높이는 46px */}
            <Header />
            <main className="flex-1 overflow-y-hidden bg-white  ">
              <div className="mx-auto w-full h-full bg-slate-50 overflow-hidden">
                <AppRoutes />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </GlobalProvider>
  );
}

export default App;
