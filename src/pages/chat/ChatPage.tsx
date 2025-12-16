import { useEffect } from "react"; // [수정] useEffect 추가
import { DocList } from "./layout/DocList";
import { DocViewer } from "./layout/DocViewer";
import { ChatPanel } from "./layout/ChatPanel";
import { IterationCcwIcon } from "lucide-react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { useChatStore } from "@/store/chatStore";

export default function ChatPage() {
  const { viewMode, setViewMode, selectedSessionId } = useChatStore();

  // [핵심 수정] 세션이 변경되면 무조건 '목록(list)' 모드로 초기화
  useEffect(() => {
    if (selectedSessionId) {
      setViewMode("list");
    }
  }, [selectedSessionId, setViewMode]);

  const handleSwap = () => {
    setViewMode(viewMode === "list" ? "viewer" : "list");
  };

  const mainContent = viewMode === "viewer" ? <DocViewer /> : <DocList />;

  if (!selectedSessionId) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center transition-all duration-500 ease-in-out">
        <div className="w-full max-w-3xl h-[50%] flex flex-col border-none">
          <div className="flex-1 overflow-hidden rounded-xl">
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
          {/* Panel 1 (DocViewer / DocList) */}
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

          <PanelResizeHandle className="border border-blue-50" />

          {/* Panel 2 (ChatPanel) */}
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
