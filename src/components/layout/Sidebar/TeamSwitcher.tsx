"use client";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  sidebarMenuButtonVariants,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/hooks/useSidebar";

export function TeamSwitcher() {
  const { open: isSidebarOpen } = useSidebar();

  const tooltipText = isSidebarOpen ? "사이드바 닫기" : "사이드바 열기";

  return (
    <SidebarMenu className="group">
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            className={cn(
              sidebarMenuButtonVariants({ size: "lg" }),
              "flex justify-between data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            )}
          >
            <img
              src="/newRun_noText.png"
              className=" w-6 h-6 rounded-full group-data-[collapsible=icon]:m-1 group-data-[collapsible=icon]:group-hover:hidden opacity-85"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger
                  asChild
                  className="w-8 h-8  cursor-ew-resize rounded-md hover:bg-blue-100 opacity-80 "
                />
              </TooltipTrigger>
              <TooltipContent side={isSidebarOpen ? "bottom" : "right"}>
                <p>{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
