import * as Tooltip from "@radix-ui/react-tooltip";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Sidebar } from "./note_layour/sidebar";
import { Topbar } from "./note_layour/Topbar";
import { ContextPane } from "./note_layour/ContextPane";
import { DocViewer } from "./note_layour/DocViewer";
import { ChatPanel } from "./note_layour/ChatPanel";

/**
 * NotebookLM-like 레이아웃 (React 19 + Vite + Tailwind v4 구성 호환)
 * - 좌측: 사이드바(노트북/문서 리스트)
 * - 중앙: 상단 헤더 + 본문 2단(문서 뷰어 | 대화/질의응답)
 * - 우측: 컨텍스트 패널(메타/요약/작업)
 *
 * 분리 권장 컴포넌트
 * 1) Sidebar      → <Sidebar />
 * 2) Topbar       → <Topbar />
 * 3) DocViewer    → <DocViewer />
 * 4) ChatPanel    → <ChatPanel />
 * 5) ContextPane  → <ContextPane />
 *
 * 본 파일은 단일 구성으로 제공. 필요 시 위 5개로 분리하면 유지보수 용이.
 */

export default function NotebookLikePage() {
  return (
    <div className="min-h-screen w-full bg-blue-50 text-[14px]">
      <div className="grid grid-cols-[280px_minmax(0,1fr)_360px] grid-rows-[auto_minmax(0,1fr)] gap-0 w-full  mx-auto">
        {/* Sidebar */}
        <aside className="row-span-2 border-r border-blue-100 bg-white/60 backdrop-blur-sm">
          <Sidebar />
        </aside>

        {/* Topbar spans middle+right */}
        <header className="col-span-2 border-b border-blue-100 bg-white/70 backdrop-blur-sm">
          <Topbar />
        </header>

        {/* Main content area */}
        <main className="col-span-1 overflow-hidden">
          <MainTwoPane />
        </main>

        {/* Right contextual pane */}
        <aside className="border-l border-blue-100 bg-white/60 backdrop-blur-sm overflow-y-auto">
          <ContextPane />
        </aside>
      </div>
    </div>
  );
}

/* ------------- Main two-pane ------------- */
export function MainTwoPane() {
  return (
    <div className="h-full grid grid-cols-2">
      <DocViewer />
      <ChatPanel />
    </div>
  );
}

/* ---------------- Small UI bits ----------- */
export function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-3">
      <div className="flex items-center gap-2 text-sm font-medium mb-2">
        {icon}
        {title}
      </div>
      <div className="text-[13px] text-blue-900/80">{children}</div>
    </div>
  );
}

export function IconButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-blue-100 text-blue-700"
            aria-label={label}
            title={label}
          >
            {children}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content
          sideOffset={6}
          className="rounded-md border border-blue-100 bg-white px-2 py-1 text-xs shadow-sm"
        >
          {label}
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export function Dropdown({
  children,
  items,
  align = "start",
}: {
  children: React.ReactNode; // ← 필수
  items: { label: string; icon?: React.ReactNode }[]; // ← 아이콘은 JSX
  align?: "start" | "end";
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-blue-100 text-blue-700"
        >
          {children}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align={align}
        sideOffset={6}
        className="min-w-[180px] rounded-lg border border-blue-100 bg-white p-1 shadow-md"
      >
        {items.map((it, i) => (
          <DropdownMenu.Item
            key={i}
            className="group flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-blue-50"
          >
            {it.icon ? <span className="text-blue-700">{it.icon}</span> : null}
            <span>{it.label}</span>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
