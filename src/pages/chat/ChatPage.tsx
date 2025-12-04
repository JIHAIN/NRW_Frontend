import { DocList } from "./layout/DocList";
import { DocViewer } from "./layout/DocViewer";
import { ChatPanel } from "./layout/ChatPanel";
// import { useState } from "react";
import { IterationCcwIcon } from "lucide-react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { useChatStore } from "@/store/chatStore"; // 스토어

export default function ChatPage() {
  // 전역 상태 사용
  const { viewMode, setViewMode, selectedSessionId } = useChatStore();

  const handleSwap = () => {
    // 토글 기능
    setViewMode(viewMode === "list" ? "viewer" : "list");
  };

  const mainContent = viewMode === "viewer" ? <DocViewer /> : <DocList />;

  if (!selectedSessionId) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center transition-all duration-500 ease-in-out">
        {/* max-w-3xl로 너비를 적당히 제한하고, h-[90%] 정도로 위아래 여백을 줍니다. */}
        <div className="w-full max-w-3xl h-[50%] flex flex-col border-none">
          <div className="flex-1 overflow-hidden rounded-xl  ">
            {/* shadow나 border를 살짝 주면 중앙에 떠있는 느낌을 더 잘 줄 수 있습니다 (선택사항) */}
            <ChatPanel />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden w-full h-full max-w-full text-[14px] border-t border-blue-100">
      <main className="col-span-1 overflow-hidden h-full ">
        <PanelGroup direction="horizontal" className="h-full">
          {/* ================================== */}
          {/* Panel 1 (DocViewer / DocList) */}
          {/* ================================== */}
          <Panel defaultSize={50} minSize={10}>
            <section className=" h-full w-full flex flex-col  ">
              <div className="flex justify-between border-b border-blue-100 px-4 py-2">
                <div className="text-xs font-semibold text-blue-900/70  ">
                  {viewMode === "viewer" ? "문서 상세 정보" : "참조 문서 목록"}
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
