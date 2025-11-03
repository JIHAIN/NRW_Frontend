import {
  Ellipsis,
  MessageSquare,
  Paperclip,
  Settings,
  Upload,
} from "lucide-react";
import { Dropdown, IconButton } from "../notebook";

/* ---------------- Topbar ---------------- */
export function Topbar() {
  return (
    <div className="h-14 px-4 flex items-center justify-between">
      <div className="font-semibold">문서 이해·요약·QA</div>
      <div className="flex items-center gap-2">
        <IconButton label="업로드">
          <Upload className="size-4" />
        </IconButton>
        <IconButton label="설정">
          <Settings className="size-4" />
        </IconButton>
        <Dropdown
          align="end"
          items={[
            { label: "새 채팅", icon: <MessageSquare className="size-4" /> },
            { label: "문서 추가", icon: <Paperclip className="size-4" /> },
          ]}
        >
          <Ellipsis className="size-4" />
        </Dropdown>
      </div>
    </div>
  );
}
