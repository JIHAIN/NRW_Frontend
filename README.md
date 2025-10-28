# AlAin Frontend

문서 기반 RAG 서비스를 위한 프론트엔드 애플리케이션으로, React + TypeScript + Vite를 기반으로 설계되었습니다. 현재는 와이어프레임/프로토타입 단계로 주요 화면과 레이아웃 구조를 빠르게 구축하는 데 초점을 맞추고 있습니다.

## 기술 스택
- React 18, TypeScript, Vite
- React Router v6
- TanStack Query (데이터 캐싱/상태 관리용 Provider 구성)
- Tailwind CSS, class-variance-authority, tailwind-merge
- Radix UI 기반 커스텀 UI 프리미티브(button, input, tooltip 등)

## 폴더 구조
```text
src/
├── app/                 # 엔트리 레벨 셸(App, routes, providers)
├── assets/              # 정적 자산 (로고 등)
├── components/
│   ├── common/          # 토스트, 프로그레스바 등 공통 유틸 컴포넌트 (스텁)
│   ├── layout/          # Header, ProtectedRoute 등 전역 레이아웃 요소
│   └── ui/              # 버튼/카드/툴팁 같은 디자인 토큰 컴포넌트
├── lib/                 # 전역 유틸(api/auth/storage) 모듈 스텁
├── pages/
│   ├── index.tsx        # 랜딩/검색 입력 메인 화면
│   ├── auth/            # 로그인/회원가입 토글 폼
│   ├── chat/            # 간단한 QA 채팅 와이어프레임
│   ├── dashboard/       # 목업 데이터 기반 대시보드 프로토타입
│   ├── docs/            # 문서 리스트 및 상세 모달
│   ├── upload/          # 문서 업로드 흐름 와이어프레임
│   └── ...              # admin, about 등 향후 확장 스텁
├── services/            # API 호출/도메인 로직 레이어 스텁
├── store/               # 전역 상태 관리 도입을 위한 자리(현재 비어 있음)
├── index.css            # Tailwind 진입점 및 최소 전역 스타일
└── main.tsx             # ReactDOM 렌더링 엔트리
```

## 현재 진행 상황
| 영역 | 상태 | 비고 |
| --- | --- | --- |
| 전역 레이아웃 | ✅ Header/Provider 구성 완료, Footer 스텁 | 인증 게이트/푸터 확장 예정 |
| 라우팅 | ✅ `/`, `/auth/login_signup`, `/chat`, `/dashboard`, `/docs`, `/upload` 연결 | ProtectedRoute/404는 스텁 상태 |
| 문서 리스트 | ✅ 목업 데이터 기반 카드 리스트, 검색/상태 필터, 상세 모달 연동 | 상세 모달은 body-scroll lock 및 내부 스크롤 적용 |
| 문서 상세 | ✅ 모달 형태로 메타데이터/미리보기/최근 로그 섹션 구성 | 실제 뷰어 연결은 추후 구현 |
| 업로드 플로우 | ✅ 파일 선택, 메타데이터 입력, 모의 제출 피드백 | 백엔드 API 연동 예정 |
| 대시보드 | ✅ 목업 데이터로 카드/차트 UI 와이어프레임 구성 | 섹션 분리 및 실제 데이터 연동 필요 |
| 서비스/스토어 | ⚪ 스텁만 존재 | API 스펙 확정 후 구현 예정 |

## 앞으로의 작업
1. 백엔드 API 스펙 확정 후 `services/` 계층 구현 및 TanStack Query 연동.
2. 문서 상세 모달을 라우터(`/docs/:id`)와 통합하거나 별도 상태 관리로 개선.
3. 업로드·문서 리스트에 실제 파일 처리 및 진행 상태 갱신 기능 추가.
4. 공통 컴포넌트(`FileDrop`, `Toast`, `ProgressBar`) 구체화 및 페이지와 연동.

## 개발 명령어
```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

Pull Request 전에는 `npm run lint`와 `npm run build`를 통해 기본 검증을 진행해 주세요.
