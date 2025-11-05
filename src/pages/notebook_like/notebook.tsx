import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { DocList } from "./note_layour/DocList";
import { DocViewer } from "./note_layour/DocViewer";
import { ChatPanel } from "./note_layour/ChatPanel";
import { useState } from "react";
import { IterationCcwIcon } from "lucide-react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

export default function NotebookLikePage() {
  // 페이지 전환기능용
  const [SidevarOn, setSidevarOn] = useState(true);

  const handleSwap = () => {
    setSidevarOn((prev) => !prev);
  };

  const mainContent = SidevarOn ? <DocViewer /> : <DocList />;
  // 여기까지 페이지 전환기능

  return (
    <div className="flex-1 overflow-hidden w-full h-full max-w-full text-[14px] ">
      <main className="col-span-1 overflow-hidden h-full ">
        <PanelGroup direction="horizontal" className="h-full">
          {/* ================================== */}
          {/* Panel 1 (DocViewer / DocList) */}
          {/* ================================== */}
          <Panel defaultSize={50} minSize={10}>
            <section className=" h-full w-full flex flex-col bg-white  ">
              <div className="flex justify-between border-b border-blue-100 px-4 py-2">
                <div className="text-xs font-semibold text-blue-900/70  ">
                  문서 뷰어
                </div>
                <button
                  onClick={handleSwap}
                  className=" text-blue-300 rounded-2xl point-hover"
                >
                  <IterationCcwIcon size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden px-4">{mainContent}</div>
            </section>
          </Panel>

          {/* 사이즈 조절 경계선 */}
          <PanelResizeHandle className="border border-blue-50" />

          {/* ================================== */}
          {/* Panel 2 (ChatPanel) */}
          {/* ================================== */}
          <Panel defaultSize={50} minSize={10}>
            <section className=" h-full bg-white w-full flex flex-col">
              <div className="border-b border-blue-100 px-4 py-1 ">
                <div className="mb-3 text-xs  font-semibold text-blue-900/70 ">
                  채팅
                </div>
              </div>
              <div className="flex-1 overflow-hidden pb-3 flex flex-col gap-4">
                <ChatPanel />
              </div>
            </section>
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}

export function Dropdown({
  children,
  items,
  align = "start",
}: {
  children: React.ReactNode; // ← 필수
  items: { label: string; icon?: React.ReactNode }[];
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
