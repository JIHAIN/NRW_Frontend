"use client";

import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
}) {
  const { open: isSidebarOpen } = useSidebar();
  const [activeTeam] = React.useState(teams[0]);

  if (!activeTeam) {
    return null;
  }
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
                src=" ./newRun_noText.png"
                className=" w-6 h-6 rounded-full group-data-[collapsible=icon]:m-1 group-data-[collapsible=icon]:group-hover:hidden opacity-85"
              />
              <div className="grid flex-1 text-center text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-blue-500">
                  NEURON WAY
                </span>
                <span className="truncate text-xs font-bold text-blue-500">
                  Alain
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger>
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
