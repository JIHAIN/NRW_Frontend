import AppRoutes from "./routes"; // 정의된 라우트 테이블 임포트
import GlobalProvider from "./providers"; // 전역 상태/쿼리 관리 Provider
import Header from "@/components/layout/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
// import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppSidebar2 } from "@/components/layout/Sidebar/navSidebar";

function App() {
  return (
    <GlobalProvider>
      <SidebarProvider>
        <div className="min-h-screen flex flex-1">
          <AppSidebar2 />
          <div className="w-full flex-col ">
            <main className="flex-1 overflow-y-auto  ">
              <Header />
              <div className="mx-auto w-full max-w-5xl  ">
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

//  <GlobalProvider>
//       <SidebarProvider>
//         <AppSidebar2 />
//       </SidebarProvider>
//     </GlobalProvider>
