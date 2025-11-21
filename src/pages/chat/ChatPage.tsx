import { DocList } from "./layout/DocList";
import { DocViewer } from "./layout/DocViewer";
import { ChatPanel } from "./layout/ChatPanel";
// import { useState } from "react";
import { IterationCcwIcon } from "lucide-react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { useChatStore } from "@/store/chatStore"; // 스토어

export default function ChatPage() {
  // 전역 상태 사용
  const { viewMode, setViewMode } = useChatStore();

  const handleSwap = () => {
    // 토글 기능
    setViewMode(viewMode === "list" ? "viewer" : "list");
  };

  const mainContent = viewMode === "viewer" ? <DocViewer /> : <DocList />;

  return (
    <div className="flex-1 overflow-hidden w-full h-full max-w-full text-[14px] ">
      <main className="col-span-1 overflow-hidden h-full ">
        <PanelGroup direction="horizontal" className="h-full">
          {/* ================================== */}
          {/* Panel 1 (DocViewer / DocList) */}
          {/* ================================== */}
          <Panel defaultSize={50} minSize={10}>
            <section className=" h-full w-full flex flex-col  ">
              <div className="flex justify-between border-b border-blue-100 px-4 py-2">
                <div className="text-xs font-semibold text-blue-900/70  ">
                  문서 뷰어
                </div>
                <button
                  onClick={handleSwap}
                  className=" text-blue-300 rounded-2xl point-hover"
                >
                  <IterationCcwIcon size={15} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">{mainContent}</div>
            </section>
          </Panel>

          {/* 사이즈 조절 경계선 */}
          <PanelResizeHandle className="border border-blue-50" />

          {/* ================================== */}
          {/* Panel 2 (ChatPanel) */}
          {/* ================================== */}
          <Panel defaultSize={50} minSize={10}>
            <section className=" h-full  w-full flex flex-col">
              <div className="border-b border-blue-100 px-4 py-2 ">
                <div className="  text-xs  font-semibold text-blue-900/70 ">
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
