# Frontend 구조 개요

## 기술 베이스

- Vite + React + TypeScript 조합으로 빠른 빌드와 TS 기반 정적 분석을 확보했습니다.
- React Router v6로 페이지 라우팅을 담당하고, TanStack Query(QueryClientProvider)로 서버 상태 캐싱 뼈대를 마련했습니다.
- Tailwind CSS와 `tailwind-merge`/`clsx` 유틸을 활용해 스타일 일관성을 유지하며, Radix UI 기반 `tooltip`, 커스텀 `button`, `card` 컴포넌트가 재사용 가능한 UI 토큰 역할을 합니다.

## 주요 디렉터리 구조

```text
frontend/
|-- src/
|   |-- main.tsx
|   |-- index.css
|   |-- app/
|   |   |-- App.tsx
|   |   |-- providers.tsx
|   |   `-- routes.tsx
|   |-- assets/
|   |-- components/
|   |   |-- common/
|   |   |   |-- FileDrop.tsx
|   |   |   |-- ProgressBar.tsx
|   |   |   `-- Toast.tsx
|   |   |-- layout/
|   |   |   |-- Footer.tsx
|   |   |   |-- Header.tsx
|   |   |   `-- ProtectedRoute.tsx
|   |   `-- ui/
|   |       |-- button.tsx
|   |       |-- card.tsx
|   |       |-- input.tsx
|   |       |-- NoticeCard.tsx
|   |       |-- NoticeTable.tsx
|   |       |-- StateChart.tsx
|   |       `-- tooltip.tsx
|   |-- lib/
|   |   |-- api.ts
|   |   |-- auth.ts
|   |   |-- storage.ts
|   |   `-- utils.ts
|   |-- pages/
|   |   |-- index.tsx
|   |   |-- about.tsx
|   |   |-- NotFound.tsx
|   |   |-- admin/AdminPage.tsx
|   |   |-- auth/loginSignup.tsx
|   |   |-- chat/ChatPage.tsx
|   |   |-- dashboard/DashBoard.tsx
|   |   |-- docs/DocDetailPage.tsx
|   |   |-- docs/DocsListPage.tsx
|   |   `-- upload/UploadPage.tsx
|   |-- services/
|   |   |-- auth.service.ts
|   |   |-- documents.service.ts
|   |   `-- qa.service.ts
|   `-- store/
|-- public/
|   `-- (정적 자산: 예) alain_textOnly2.png)
`-- 구성 파일 (vite.config.ts, tsconfig*, eslint.config.js 등)
```

## 디렉터리별 설명

### 엔트리 레벨 (`src/main.tsx`, `src/app/`)

- `main.tsx`: ReactDOM 렌더링 엔트리로 `BrowserRouter`와 `App`을 감싼 기본 뼈대입니다.
- `app/App.tsx`: 전역 Provider(`GlobalProvider`)와 글로벌 레이아웃(`Header`)을 합쳐 최상위 셸을 제공합니다. 향후 `Footer`나 글로벌 상태 Provider를 이 레이어에 추가하면 라우트별 중복 없이 유지보수가 쉬워집니다.
- `app/providers.tsx`: TanStack Query 클라이언트 초기화와 전역 Provider 등록을 담당합니다. 추후 테마/국제화 Provider 등을 체인으로 연결하기 용이한 형태입니다.
- `app/routes.tsx`: 라우트 테이블을 별도 모듈화해 페이지 추가·수정 시 관리를 단일 파일에서 할 수 있습니다. 향후 `ProtectedRoute` 또는 에러 경로를 여기에 주입하면 라우팅 정책이 명확해집니다.

### 재사용 컴포넌트 (`src/components/`)

- `layout/`: 앱 공통 레이아웃 요소를 보관합니다. `Header.tsx`는 내비게이션 링크와 CTA 버튼을 포함하고, `ProtectedRoute.tsx`는 인증 게이트웨이 뼈대를 제공합니다. `Footer.tsx`는 아직 비어 있으나 전역 푸터가 필요한 경우 이 위치에서 관리합니다.
- `ui/`: 원자적/유틸리티 성격의 UI 요소를 분리했습니다. 버튼·카드·입력 필드는 Tailwind + cva 패턴으로 변형을 추상화해, 스타일 가이드 변경 시 한 곳에서 제어할 수 있습니다. `NoticeCard`, `NoticeTable`, `StateChart` 등은 도메인 특화 프리미티브로, 대시보드/공지 UI에 재사용됩니다.
- `common/`: 토스트, 프로그레스바, 파일 드롭 등 전역 유틸 컴포넌트를 담기 위한 공간으로 마련되어 있으며, 현재는 와이어프레임 단계의 빈 파일입니다. 후속 구현 시 이 위치에서 import 재사용이 명확해집니다.

### 비즈니스 로직 모듈 (`src/lib/`, `src/services/`, `src/store/`)

- `lib/`: 전역 유틸리티 레벨. `utils.ts`의 `cn` 함수처럼 UI에서 반복되는 클래스를 정리하고, 아직 비어있는 `api.ts`, `auth.ts`, `storage.ts`는 네트워크·인증·로컬스토리지 래퍼를 모듈화할 자리입니다. 도메인 서비스와 분리해 테스트와 교체가 쉬워집니다.
- `services/`: 실제 API 호출과 도메인 비즈니스 로직을 배치할 레이어입니다. 지금은 빈 스텁으로, 네임스페이스만 지정해 두어 추후 각 기능 모듈(`auth`, `documents`, `qa`)별로 책임이 분리되도록 유도합니다.
- `store/`: 전역 상태 관리(예: Zustand, Redux Toolkit 등)를 도입할 여지를 마련한 디렉터리입니다. 현재 비어 있지만, 위치가 고정되어 있어 도입 시 구조 변경이 최소화됩니다.

### 페이지 (`src/pages/`)

- 라우터 경로와 1:1 대응되는 페이지가 폴더별로 나뉘어 있습니다. 페이지별 세부 UI는 컴포넌트 레이어로 분리할 수 있게 설계되어 있습니다.
- `pages/index.tsx`: 랜딩/검색 입력 영역과 푸터를 포함한 메인 홈 화면입니다. Tailwind 기반 레이아웃으로 빠르게 스캐폴딩 되어 있으며, 컴포넌트 분리(검색 입력, 퀵 액션 버튼 등) 여지를 남겨 두었습니다.
- `pages/auth/loginSignup.tsx`: 로그인/회원가입 토글형 폼. 향후 공통 폼 상태, 인증 서비스 연동을 `services/auth.service.ts`와 연결하기 쉽게 독립되어 있습니다.
- `pages/chat/ChatPage.tsx`: 간단한 상태 기반 채팅 인터페이스 프로토타입입니다. 메시지 배열/입력 상태를 로컬 `useState`로 관리해, 이후 실시간 데이터 연동 시 상태 관리 레이어로 끌어올리기 편합니다.
- `pages/dashboard/DashBoard.tsx`: 목업 데이터와 풍부한 UI(카드, SVG 차트 등)를 한 파일에 모아 와이어프레임을 제시합니다. 나중에 영역별 컴포넌트 분리 및 서비스 주입이 명확하도록 타입과 목업 구조를 정의해 둔 점이 유지보수에 유리합니다.
- `pages/docs/`, `pages/upload/`, `pages/admin/`, `pages/about.tsx`, `pages/NotFound.tsx`: 아직 구현 전으로 비어 있으나, 라우팅과 내비게이션 구조를 미리 확보해 개발 범위를 시각화하고 있습니다.

### 스타일 및 자산

- `index.css`: Tailwind 프레임워크 import와 전역 폰트 스무딩 설정만 포함해 최소 전역 스타일을 유지합니다. Tailwind 설정이 이미 적용돼 있어 컴포넌트 단위로 클래스를 추가하기 쉽습니다.
- `assets/`: 로고, 아이콘 등 정적 자산을 둘 위치입니다(현재 상세 파일은 없음).
- `public/`: `alain_textOnly2.png`와 같은 정적 파일이 위치하며, `Header`와 `Auth` 페이지에서 참조합니다. Vite의 정적 자산 서빙 규칙에 맞춘 배치입니다.

### 구성 파일

- `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`: 빌드/타입/품질 설정이 루트에 배치돼 있어 팀 공통 규칙을 쉽게 재사용할 수 있습니다. 추후 절대경로 alias(`@/…`)나 환경 변수 설정도 이 위치에서 중앙관리 할 수 있습니다.

## 구조적 의도와 유지보수 포인트

- **레이어 분리**: `app` → `pages` → `components/ui|common|layout` → `services|lib`로 이어지는 레이어링 덕분에 UI/도메인/인프라 코드를 명확히 구분할 수 있습니다. 기능 추가 시 해당 레이어에서만 변경하면 되므로 영향도를 줄일 수 있습니다.
- **스텁 선제 배치**: 많은 파일이 비어 있지만, 모듈 위치를 미리 정해 두어 팀원들이 동시에 작업할 때 충돌을 줄이고, 구현 우선순위를 한눈에 볼 수 있습니다.
- **재사용 가능한 UI 토큰**: 버튼, 카드, 입력 등 기본 컴포넌트를 통일된 스타일로 정의해, 페이지 와이어프레임을 빠르게 꾸미면서도 나중에 디자인 시스템 교체가 쉬운 구조입니다.
- **확장성 고려 라우팅**: `ProtectedRoute` 스텁과 `routes.tsx` 분리 덕분에 인증, 권한, 404 처리 등을 중앙 집중형으로 운영할 수 있습니다.
- **데이터 계층 준비**: TanStack Query Provider와 `services/` 스텁은 API 연동 시 캐싱·에러 핸들링 로직을 한 곳에 모으도록 돕습니다. 이는 추후 테스트와 코드 재사용성을 높이는 기반이 됩니다.
