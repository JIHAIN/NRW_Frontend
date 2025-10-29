import AppRoutes from "./routes"; // 정의된 라우트 테이블 임포트
import GlobalProvider from "./providers"; // 전역 상태/쿼리 관리 Provider
import Header from "@/components/layout/Header";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

function App() {
  return (
    <GlobalProvider>
      <SidebarProvider>
        <div className="flex flex-1">
          <AppSidebar />
          <div className="flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto">
              <SidebarTrigger />
              <AppRoutes />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </GlobalProvider>
  );
}

export default App;
