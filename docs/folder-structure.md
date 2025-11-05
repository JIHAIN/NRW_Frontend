# 폴더 구조 개요

> 기준 경로: `NRW_Frontend_tmp/`

```
├── public/                     # 정적 자산 (브랜드 이미지 등)
├── src/
│   ├── app/                    # 앱 엔트리, 전역 Provider 및 라우터 설정
│   ├── components/
│   │   ├── common/             # 범용 유틸 컴포넌트 (Icon, FileDrop 등)
│   │   ├── layout/             # Header, Sidebar 등 레이아웃 구성 요소
│   │   │   └── Sidebar/        # 사이드바 메뉴/토글 관련 서브 컴포넌트
│   │   └── ui/                 # 버튼, 카드, 툴팁 등 디자인 시스템 컴포넌트
│   ├── hooks/                  # 커스텀 훅 (예: 모바일 감지)
│   ├── lib/                    # API, 인증, 스토리지 유틸
│   ├── pages/
│   │   ├── auth/               # 로그인/회원가입 등 인증 화면
│   │   ├── chat/               # 채팅 UI
│   │   ├── dashboard/          # KPI/현황 대시보드
│   │   ├── docs/               # 문서 리스트/상세 뷰
│   │   ├── notebook_like/      # 노트 및 채팅을 통합한 작업 공간
│   │   │   └── note_layour/    # 노트형 레이아웃 하위 컴포넌트 (DocList 등)
│   │   ├── upload/             # 파일 업로드 화면
│   │   └── ...                 # (향후 확장을 위한 기타 페이지 슬롯)
│   └── services/               # API 연동 서비스 모듈
├── components.json             # UI 구성 요소 메타데이터
├── frontend-structure.md       # 기존 구조 설명 문서
├── package.json                # 프로젝트 의존성 및 스크립트
├── tsconfig*.json              # TypeScript 설정
└── vite.config.ts              # Vite 번들 설정
```

## 참고 사항
- `docs/history/` 폴더에는 일자별 작업 일지가 정리되어 있습니다.
- `SidebarProvider` 등 전역 컨텍스트는 `src/app/providers.tsx`에서 관리하며, 레이아웃 컴포넌트와 긴밀히 연결되어 있습니다.
- `services/` 폴더는 현재 뼈대 수준으로, 실제 API 연동 시 이 레이어를 통해 비즈니스 로직을 모듈화할 수 있습니다.
