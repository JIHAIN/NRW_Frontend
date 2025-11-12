# 2025-11-05 작업 일지

## 주요 성과
- Notebook like 문서/채팅 화면을 react-resizable-panels 기반 이중 패널 구조로 재편하고 문서 뷰어와 문서 목록 전환 토글을 추가했습니다.
- 채팅 패널에 파일 첨부 드래그 앤 드롭, 중복 방지, IME 대응 입력 처리, 자동 높이 조절을 구현해 실제 대화 흐름을 재현했습니다.
- SidebarProvider를 중심으로 Header·Sidebar·App 레이아웃을 다시 구성하여 고정 헤더와 본문 영역을 정리하고 네비게이션 경험을 맞췄습니다.
- 팀 스위처와 사용자 메뉴에 툴팁·포커스 스타일·브랜드 자산을 적용해 축소된 사이드바에서도 조작성을 높였습니다.

## 상세 작업 내역
- frontend/src/pages/notebook_like/notebook.tsx: PanelGroup으로 문서 뷰어와 채팅을 분할하고 문서 뷰어↔목록 전환 버튼을 추가했습니다.
- frontend/src/pages/notebook_like/note_layour/ChatPanel.tsx: 메시지 상태 관리, 첨부파일 드래그 앤 드롭/중복 제거, textarea 자동 리사이즈, 드롭다운 및 툴팁 UI를 작성했습니다.
- frontend/src/pages/notebook_like/note_layour/DocList.tsx: 검색 입력 UI와 최근 문서 리스트를 구성하고 공용 IconButton을 활용해 리스트 액션을 정리했습니다.
- frontend/src/pages/notebook_like/note_layour/DocViewer.tsx: 문서 제목/아이콘과 미리보기 영역을 분리해 기본 뷰어 레이아웃을 마련했습니다.
- frontend/src/pages/docs/DocsListPage.tsx: 문서 목록/그리드 전환, 상태 필터, 상세 모달 연동 등 문서 탐색 흐름을 구축했습니다.
- frontend/src/components/layout/Sidebar/navSwitcher.tsx: 워크스페이스 드롭다운과 사이드바 토글 툴팁을 정비하고 로고 이미지를 노출했습니다.
- frontend/src/components/layout/Sidebar/navUser.tsx: 사용자 드롭다운 정렬과 point-hover 스타일을 보강해 상호작용을 일관화했습니다.
- frontend/src/components/layout/Header.tsx, frontend/src/app/App.tsx: SidebarProvider 적용과 헤더/본문 배치를 조정해 전체 레이아웃을 고정했습니다.
- frontend/src/components/ui/card.tsx: 공통 카드 컴포넌트의 기본 클래스 구성을 정리했습니다.
