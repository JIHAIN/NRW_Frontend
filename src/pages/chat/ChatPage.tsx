import { useRef, useState, useEffect, type DragEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BadgeCheck,
  Paperclip,
  X,
  File as FileIcon,
  ArrowBigUpIcon,
  Ellipsis,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 유틸: 파일 크기 포맷팅
function bytes(n: number) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

// ChatGPT 유사 입력창: Shift+Enter 줄바꿈, Enter 전송, 첨부가 입력창 내부에 표시되어 높이만 증가
export default function ChatUI() {
  // 메시지 상태
  const [messages, setMessages] = useState<
    { role: "assistant" | "user"; content: string }[]
  >([{ role: "assistant", content: "안녕하세요. 무엇을 도와드릴까요?" }]);

  // 입력창 상태
  const [input, setInput] = useState("");
  const [isComposing, setIsComposing] = useState(false); // IME 조합 상태(한글 등)

  // 파일 상태
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // ref
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 스크롤 하단 고정
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // textarea 자동 높이 조절
  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "0px"; // 재계산 초기화
    const next = Math.min(200, ta.scrollHeight); // 최대 200px
    ta.style.height = next + "px";
  };
  useEffect(() => autoResize(), [input, files.length]);

  // 메시지 전송
  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
  };

  // 파일 중복 방지 병합
  const mergeFiles = (incoming: File[]) => {
    setFiles((prev) => {
      const key = (f: File) => `${f.name}:${f.size}:${f.lastModified}`;
      const map = new Map(prev.map((f) => [key(f), f]));
      for (const f of incoming) map.set(key(f), f);
      return Array.from(map.values());
    });
  };

  // 파일 선택
  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    mergeFiles(Array.from(list));
    e.target.value = "";
  };

  // Drag & Drop 전역 수신(컴포저만 커지도록 하고, 별도 상단 패널은 없음)
  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      mergeFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  // 파일 제거
  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  // 업로드 API가 POST /api/upload 여기서
  // const mockUpload = async () => {
  //   alert(`${files.length}개 파일 업로드 시뮬레이션`);
  // };

  // 파일 선택 열기
  const openFilePicker = () => fileInputRef.current?.click();

  // 키 핸들링: Enter 전송, Shift+Enter 줄바꿈, IME 조합 중 무시
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      className="flex flex-col h-[700px] w-full max-w-6xl rounded-3xl "
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* 드래그 오버 오버레이 */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-3xl border-4 border-dashed border-blue-400/70 bg-blue-100/50" />
      )}

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-5 py-10  flex flex-col gap-3 rounded-t-2xl">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <Card
              className={`max-w-[75%] ${
                msg.role === "user"
                  ? "bg-blue-400 text-white rounded-br-none p-0"
                  : "bg-gray-100 rounded-bl-none p-0"
              }`}
            >
              <CardContent className="p-3 text-sm whitespace-pre-wrap">
                {msg.content}
              </CardContent>
            </Card>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* 입력 컴포저: 첨부 미리보기 + textarea + 액션들이 하나의 form 내부 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className=" bg-white rounded-b-2xl p-2 flex flex-col gap-2"
      >
        {/* 숨김 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onPickFiles}
        />

        {/* 첨부 리스트: 입력창 내부 상단에 칩 형태로 표시. 존재 시 컴포저 높이만 증가 */}
        {files.length > 0 && (
          <div className="flex flex-wrap items-start gap-2 px-1">
            <div className="text-xs text-gray-600 mr-1">
              첨부 {files.length}개
            </div>
            {files.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                className="group flex items-center gap-2 rounded-lg border px-2 py-1 text-xs bg-white"
              >
                <FileIcon className="size-3.5" />
                <span
                  className="max-w-48 truncate"
                  title={`${f.name} (${bytes(f.size)})`}
                >
                  {f.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="opacity-70 group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFiles([])}
              className="ml-auto text-[11px] text-gray-500 hover:text-gray-800"
            >
              모두 제거
            </button>
          </div>
        )}

        {/* 하단 행: 메뉴, textarea, 전송, 업로드 버튼 */}
        <div className="flex items-end gap-2  rounded-2xl border border-blue-100 focus:ring-2 focus:ring-blue-200">
          <Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TooltipTrigger asChild>
                  <span
                    role="button"
                    tabIndex={0}
                    className="text-blue-600 size-9 px-1.5 rounded-2xl cursor-pointer"
                    aria-label="열기"
                  >
                    <Ellipsis className="m-1" />
                  </span>
                </TooltipTrigger>
              </DropdownMenuTrigger>
              <TooltipContent>
                <p>파일 추가</p>
              </TooltipContent>

              <DropdownMenuContent
                align="start"
                side="top"
                sideOffset={8}
                className="glass-toltip"
              >
                <DropdownMenuGroup className="">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      openFilePicker();
                    }}
                    className="point-gray"
                  >
                    <Paperclip className="mr-2" /> 파일 업로드
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup className="point-gray">
                  <DropdownMenuItem>
                    <BadgeCheck className="mr-2" /> 옵션 A
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </Tooltip>

          {/* textarea: 자동 리사이즈, Shift+Enter 줄바꿈, Enter 전송 */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="ALAiN에게 물어보기"
            rows={1}
            className="flex-1 max-h-[200px] resize-none  px-4 py-2 text-sm focus:outline-none scroll-auto"
          />
          <button
            type="submit"
            className="rounded-2xl bg-blue-600  p-2 text-white hover:bg-blue-700 cursor-pointer"
          >
            <ArrowBigUpIcon />
          </button>
        </div>

        {/* 하단 힌트 */}
        <div className="px-1 text-[11px] text-center text-xs text-gray-500">
          Enter 전송 · Shift+Enter 줄바꿈 · 파일은 이 영역으로 드래그해서 추가
        </div>
      </form>
    </div>
  );
}
