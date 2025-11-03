import { FileText, Info, Play } from "lucide-react";
import { Panel } from "../notebook";

/* ---------------- ContextPane ------------- */
export function ContextPane() {
  return (
    <section className="h-full p-4">
      <div className="mb-3 text-xs font-semibold text-blue-900/70">
        컨텍스트
      </div>
      <div className="space-y-3">
        <Panel title="요약" icon={<Info className="size-4 text-blue-700" />}>
          선택 문서의 핵심 요약이 여기에 표시됩니다.
        </Panel>
        <Panel
          title="오디오 개요"
          icon={<Play className="size-4 text-blue-700" />}
        >
          오디오로 듣기 같은 부가 기능 섹션.
        </Panel>
        <Panel
          title="관련 문서"
          icon={<FileText className="size-4 text-blue-700" />}
        >
          연관 문서 목록을 붙일 수 있습니다.
        </Panel>
      </div>
    </section>
  );
}
