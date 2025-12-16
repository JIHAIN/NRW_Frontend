"use client";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  sidebarMenuButtonVariants,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/hooks/useSidebar";
import { PanelLeft } from "lucide-react"; // 아이콘 직접 임포트
import IcosahedronLogo from "@/components/common/IcosahedronLogo";

export function TeamSwitcher() {
  const { open: isSidebarOpen, toggleSidebar } = useSidebar(); // toggleSidebar 가져오기
  const tooltipText = isSidebarOpen ? "사이드바 닫기" : "사이드바 열기";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            asChild // Trigger를 div로 렌더링하기 위해 asChild 사용 고려, 여기선 스타일만 적용
            className={cn(
              sidebarMenuButtonVariants({ size: "lg" }),
              "flex items-center justify-between data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground "
            )}
          >
            <div className="w-full flex items-center justify-between">
              {/* 2. 트리거 아이콘 (평소엔 숨김, 사이드바 접히고 호버하면 보임) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation(); // 메뉴 열림 방지
                      toggleSidebar(); // 사이드바 토글
                    }}
                    className={cn(
                      "w-6 h-6 rounded-md hover:bg-gray-300 flex items-center justify-center opacity-60 cursor-ew-resize",
                      !isSidebarOpen
                        ? "hidden group-hover:flex group-hover:ml-1"
                        : ""
                    )}
                  >
                    <PanelLeft className="w-5 h-5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side={isSidebarOpen ? "bottom" : "right"}>
                  <p>{tooltipText}</p>
                </TooltipContent>
              </Tooltip>

              {/* 1. 로고 (평소엔 보임, 사이드바 접히고 호버하면 숨김) */}
              <IcosahedronLogo
                size={24}
                className={cn(
                  "transition-opacity opacity-50",
                  !isSidebarOpen && "group-hover:hidden ml-1"
                )}
              />
            </div>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
