"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/hooks/useSidebar";
import { Link } from "react-router-dom";

export function TeamSwitcher() {
  const { open: isSidebarOpen } = useSidebar();

  const tooltipText = isSidebarOpen ? "사이드바 닫기" : "사이드바 열기";

  return (
    <SidebarMenu className="group">
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="flex justify-between data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <img
                src="/newRun_noText.png"
                className=" w-6 h-6 rounded-full group-data-[collapsible=icon]:m-1 group-data-[collapsible=icon]:group-hover:hidden opacity-85"
              />
              <Link
                to="/"
                className="grid flex-1 text-center text-sm leading-tight group-data-[collapsible=icon]:hidden"
              >
                <span className="truncate font-bold text-blue-500">
                  NEURON WAY
                </span>
                <span className="truncate text-xs font-bold text-blue-500">
                  ALAIN
                </span>
              </Link>

              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="w-10 h-10  cursor-ew-resize hover:bg-blue-100 opacity-80 " />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
