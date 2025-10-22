
frontend/
├─ public/
│ └─ alain_textOnly2.png
├─ src/
│ ├─ app/ # 앱 엔트리/라우팅/프로바이더
│ │ ├─ App.tsx
│ │ ├─ routes.tsx # 라우트 테이블(/auth,/upload,/chat,/docs,/admin)
│ │ └─ providers.tsx # QueryClient, Toaster, Theme 등
│ ├─ pages/ # 라우팅 단위 페이지
│ │ ├─ auth/
│ │ │ ├─ SignIn.tsx
│ │ │ ├─ SignUp.tsx
│ │ │ └─ Forgot.tsx
│ │ ├─ upload/UploadPage.tsx
│ │ ├─ chat/ChatPage.tsx
│ │ ├─ docs/
│ │ │ ├─ DocsListPage.tsx
│ │ │ └─ DocDetailPage.tsx
│ │ ├─ admin/AdminPage.tsx
│ │ └─ NotFound.tsx
│ ├─ components/ # 재사용 컴포넌트
│ │ ├─ layout/ Header.tsx Footer.tsx ProtectedRoute.tsx
│ │ ├─ ui/ Button.tsx Input.tsx Card.tsx Modal.tsx Spinner.tsx
│ │ └─ common/ FileDrop.tsx ProgressBar.tsx Toast.tsx
│ ├─ services/ # API 경계(도메인별)
│ │ ├─ auth.service.ts # login/signup/me/refresh/logout
│ │ ├─ documents.service.ts # upload/list/status/reparse/delete
│ │ └─ qa.service.ts # ask/history
│ ├─ lib/
│ │ ├─ api.ts # axios/ky 인스턴스, 인터셉터(JWT)
│ │ ├─ auth.ts # 토큰 갱신, 가드 유틸
│ │ └─ storage.ts # 안전 스토리지(메모리/세션)
│ ├─ store/ # 상태(Zustand 등)
│ │ ├─ auth.store.ts # user, accessToken, role
│ │ └─ ui.store.ts # theme, toasts, modals
│ ├─ hooks/ # 커스텀 훅
│ │ ├─ useAuth.ts
│ │ ├─ useUpload.ts
│ │ └─ useQA.ts
│ ├─ types/ # 타입 정의
│ │ ├─ api.ts # 공통 ApiResponse, Paginate 등
│ │ └─ domain.ts # User, Document, Chunk, Citation 등
│ ├─ utils/ # 순수 유틸
│ │ ├─ validators.ts # 이메일/패스워드/파일
│ │ └─ format.ts # 날짜/바이트 표기
│ ├─ styles/
│ │ ├─ globals.css
│ │ └─ tailwind.css
│ ├─ assets/ # 로고, 일러스트
│ ├─ main.tsx
│ └─ index.css
├─ .env.development # VITE_API_URL=...
├─ .env.production
├─ tsconfig.json
├─ eslint.config.js / .eslintrc.cjs
└─ vite.config.ts

# Frontend
AlAin 프론트엔드 레포지토리입니다. 한글(HWPX) 문서를 업로드하면 AI가 내용을 분석하고 질의응답을 제공합니다. React + TypeScript + TailwindCSS 기반으로 구현되며, FastAPI 백엔드와 연동되어 RAG 기반 질의응답을 수행합니다.  - 주요 기능: 로그인 / 회원가입 / 문서 업로드 / 질의응답 / 근거 표시 - 배포 환경: Vercel - 개발 구조: 모듈형 라우팅, 서비스 분리, 상태관리

