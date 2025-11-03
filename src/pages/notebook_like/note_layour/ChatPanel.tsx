import { useState } from "react";

/* ---------------- ChatPanel -------------- */
export function ChatPanel() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >([{ role: "assistant", text: "문서에서 무엇을 찾고 싶으신가요?" }]);

  return (
    <section className="p-4 bg-white">
      <div className="mb-3 text-xs font-semibold text-blue-900/70">
        질의응답
      </div>

      <div className="h-[520px] rounded-xl border border-blue-100 flex flex-col">
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`max-w-[80%] px-3 py-2 rounded-lg ${
                m.role === "user" ? "ml-auto bg-blue-200" : "bg-blue-50"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <div className="border-t border-blue-100 p-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const t = input.trim();
              if (!t) return;
              setMsgs((s) => [...s, { role: "user", text: t }]);
              setInput("");
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="문서에 대해 질문하세요"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
            >
              전송
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
