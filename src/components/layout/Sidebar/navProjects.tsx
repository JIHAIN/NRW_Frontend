"use client";

import { Folder, Forward, MoreHorizontal, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useState } from "react";

export function NavProjects({
  projects,
}: {
  projects: {
    name: string;
    url: string;
  }[];
}) {
  const { isMobile } = useSidebar();
  const [showAll, setShowAll] = useState(false);
  // 처음에 보여줄 프로젝트 목록의 수
  const INITIAL_VISIBLE_COUNT = 6;

  // 실제로 보여줄 프로젝트 목록
  const visibleProjects = showAll
    ? projects // showAll이 true면 전체 프로젝트를 보여줌
    : projects.slice(0, INITIAL_VISIBLE_COUNT); // false면 초기 개수만큼만 보여줌

  // 숨겨진 프로젝트가 있는지 확인 (전체 프로젝트 개수가 초기 개수보다 많은 경우)
  const hasHiddenProjects = projects.length > INITIAL_VISIBLE_COUNT;

  // "More" 버튼 클릭 핸들러
  const handleToggleShow = () => {
    setShowAll(!showAll);
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-[14px] text-gray-500 ">
        채팅
      </SidebarGroupLabel>
      <SidebarMenu>
        {visibleProjects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild className="point-hover">
              <a href={item.url}>
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-30 rounded-lg glass"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem className="point-hover">
                  <Folder className="text-muted-foreground " />
                  <span>보관하기</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="point-hover">
                  <Forward className="text-muted-foreground" />
                  <span>공유하기</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="point-hover">
                  <Trash2 className="text-muted-foreground" />
                  <span>삭제하기</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        {/* 숨겨진 프로젝트가 있는 경우에만 펼치기 버튼 표시 */}
        {hasHiddenProjects && (
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-sidebar-foreground/70 point-hover"
              onClick={handleToggleShow} // 클릭 시 목록을 토글
            >
              <MoreHorizontal className="text-sidebar-foreground/70" />
              <span>{showAll ? "접기" : "펼치기"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
