import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";

import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ChatGPT 스타일의 간단한 채팅 UI
export default function ChatUI() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "안녕하세요. 무엇을 도와드릴까요?" },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null); // 👈 스크롤용 ref

  // 실제 전송 기능 없이 화면에만 추가
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen max-h-150 mx-[20%] p-0 bg-blue-50">
      {/* 메시지 표시 영역 */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
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
                  ? "bg-blue-500 text-white rounded-br-none p-0"
                  : "bg-gray-5s0 rounded-bl-none p-0"
              }`}
            >
              <CardContent className="p-3 text-sm whitespace-pre-wrap">
                {msg.content}
              </CardContent>
            </Card>
          </div>
        ))}
        {/* 👇 스크롤 기준점 */}
        <div ref={chatEndRef} />
      </div>

      {/* 입력창 */}
      <form
        onSubmit={handleSend}
        className="border-2 rounded-b-2xl border-blue-200 bg-white p-3 flex gap-2 items-center"
      >
        <Tooltip>
          <TooltipTrigger>
            <Button
              type="submit"
              variant="outline"
              className="inset-shadow-sm/25 inset-shadow-blue-600/80   text-white p-2 rounded-4xl"
            >
              <Plus className="text-blue-600 size-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="">파일 추가 및 기타</p>
          </TooltipContent>
        </Tooltip>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="flex-1  inset-shadow-sm/25 inset-shadow-blue-600/80 rounded-4xl px-4 py-2"
        />
      </form>
    </div>
  );
}
