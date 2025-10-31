import "../index.css";

import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

function MainHome() {
  return (
    <div className=" flex flex-col bg-white text-gray-800">
      <section id="qa" className="py-10">
        <div className="w-full h-130 rounded-2xl bg-blue-200 flex flex-col justify-between">
          <span></span>
          <div className=" rounded-b-2xl bg-white p-2 shadow-lg shadow-blue-400/40">
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger>
                  <Button
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
              <input
                type="text"
                placeholder="문서에 대해 질문해보세요..."
                className="flex-1  inset-shadow-sm/25 inset-shadow-blue-600/80 rounded-4xl px-4 py-2"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MainHome;
