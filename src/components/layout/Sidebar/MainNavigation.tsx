"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  sidebarMenuButtonVariants,
  SidebarMenuButton, // [추가] 접힌 상태에서 아이콘 버튼으로 사용
} from "@/components/ui/sidebar";

import { useSidebar } from "@/hooks/useSidebar";

// [추가] 접힌 상태에서 사용할 드롭다운 컴포넌트
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MainNavigation({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  // 1. 사이드바 상태 가져오기
  const { state, isMobile } = useSidebar();
  // 모바일이 아니면서 접혀있는(collapsed) 상태인지 확인
  const isCollapsed = state === "collapsed" && !isMobile;

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          // =================================================================
          // [CASE 1] 사이드바가 접혀있을 때 (아이콘 클릭 시 드롭다운 표시)
          // =================================================================
          if (isCollapsed) {
            return (
              <SidebarMenuItem key={item.title}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    {/* 접힌 상태에서는 SidebarMenuButton을 사용하여 아이콘만 깔끔하게 표시 */}
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={item.isActive}
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
                    >
                      {item.icon && <item.icon />}
                      <span className="sr-only">{item.title}</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    side="right"
                    align="start"
                    sideOffset={20}
                    className="w-48 rounded-lg bg-white shadow-md border border-slate-200"
                  >
                    <DropdownMenuLabel className="text-xs text-slate-500 font-normal px-2 py-1.5">
                      {item.title}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    {item.items?.map((subItem) => (
                      <DropdownMenuItem key={subItem.title} asChild>
                        <Link
                          to={subItem.url}
                          className="cursor-pointer flex w-full items-center p-2 text-sm hover:bg-slate-50 rounded-md outline-none focus:bg-slate-50"
                        >
                          {subItem.title}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            );
          }

          // =================================================================
          // [CASE 2] 사이드바가 펼쳐져 있을 때 (기존 코드 유지)
          // =================================================================
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                {/* 사용자님의 기존 트리거 스타일 유지 */}
                <CollapsibleTrigger
                  className={cn(
                    sidebarMenuButtonVariants({}),
                    "point-hover group/collapsible-trigger"
                  )}
                >
                  {item.icon && <item.icon />}
                  <span className="truncate">{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible-trigger:rotate-90 opacity-50" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          className="hover:bg-blue-100"
                        >
                          <Link to={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
