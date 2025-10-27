import AppRoutes from "./routes"; // 정의된 라우트 테이블 임포트
import GlobalProvider from "./providers"; // 전역 상태/쿼리 관리 Provider
import Header from "@/components/layout/Header";

function App() {
  return (
    // GlobalProvider는 main.tsx의 BrowserRouter보다 아래에 있어야 Context를 사용할 수 있습니다.
    <GlobalProvider>
      {/* 전역 레이아웃 Header ,Footer */}
      <Header />
      <main>
        {/* 라우트 테이블 렌더링 */}
        <AppRoutes />
      </main>

      {/* <Footer /> */}
    </GlobalProvider>
  );
}

export default App;
