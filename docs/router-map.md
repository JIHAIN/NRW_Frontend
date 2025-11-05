# 라우터 맵

## 전역 레이아웃 흐름
- `src/app/App.tsx`에서 `GlobalProvider` → `SidebarProvider` → `Header` → `AppRoutes` 순으로 구성됩니다.
- `AppSidebar`가 모든 화면에 고정되고, `Header` 하단의 `<main>`에 각 Route가 렌더링됩니다.

## 주요 라우트 테이블 (`src/app/routes.tsx`)

| 경로 | 컴포넌트 | 설명 |
| --- | --- | --- |
| `/` | `MainHome` (`src/pages/index.tsx`) | 랜딩/메인 홈 |
| `/auth/login_signup` | `AuthPage` (`src/pages/auth/loginSignup.tsx`) | 로그인/회원가입 통합 페이지 |
| `/dashboard` | `DashBoard` (`src/pages/dashboard/DashBoard.tsx`) | KPI/현황 대시보드 |
| `/chat` | `ChatUI` (`src/pages/chat/ChatPage.tsx`) | 실시간 채팅 화면 |
| `/docs` | `DocsListPage` (`src/pages/docs/DocsListPage.tsx`) | 문서 리스트 및 상세 진입점 |
| `/upload` | `UploadPage` (`src/pages/upload/UploadPage.tsx`) | 파일 업로드 |
| `/note` | `NotebookLikePage` (`src/pages/notebook_like/notebook.tsx`) | 노트형 작업 공간 (문서/채팅 통합) |

> 참고: `ProtectedRoute`, `NotFound` 등은 현재 주석 처리되어 있으며, 추후 인증/예외 처리를 위해 확장 예정입니다.

## 추가 고려 사항
- `AppRoutes` 내부의 ProtectedRoute 영역이 주석으로 남아 있어, 추후 로그인 기반 접근 제어를 쉽게 활성화할 수 있습니다.
- 노트형 페이지는 `note_layour` 디렉터리의 컴포넌트(`DocList`, `DocViewer`, `ChatPanel`)와 함께 동작합니다.
- 사이드바 메뉴 구성(`src/components/layout/Sidebar/*`)과 라우트 경로가 연동되어 있으므로, 메뉴 업데이트 시 라우터도 함께 점검이 필요합니다.
