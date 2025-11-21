"use client";

import { MoreHorizontal, Trash2, MessageSquare, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// ===== 스토어 임포트
import { useChatStore } from "@/store/chatStore";
import { Link } from "react-router-dom";
import { useSidebar } from "@/hooks/useSidebar";

export function ProjectsNavigation() {
  const { isMobile } = useSidebar();

  // ===== 스토어에서 데이터와 액션 가져오기
  const {
    sessions,
    currentSessionId,
    selectSession,
    deleteSession,
    clearCurrentSession,
  } = useChatStore();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between pr-2 mb-2">
        <SidebarGroupLabel>최근 대화 목록</SidebarGroupLabel>

        {/*  [새 채팅] 버튼 */}
        <button
          onClick={clearCurrentSession}
          className="text-xs flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-slate-100"
          title="새 대화 시작"
        >
          <Plus size={14} /> 새 채팅
        </button>
      </div>

      <SidebarMenu>
        {sessions.map((session) => (
          <SidebarMenuItem key={session.id}>
            <SidebarMenuButton
              asChild
              //  현재 보고 있는 채팅방이면 하이라이트 (파란색 배경 등 스타일 적용됨)
              isActive={session.id === currentSessionId}
              className="hover:bg-blue-100"
            >
              {/* 클릭 시 해당 채팅방으로 이동(선택) */}
              <Link
                to="/chat"
                onClick={() => selectSession(session.id)}
                className="w-full text-left truncate cursor-pointer"
              >
                {" "}
                <MessageSquare />
                <span className="truncate">{session.title}</span>
              </Link>
            </SidebarMenuButton>

            {/* 더보기 메뉴 (...) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="cursor-pointer hover:bg-red-200 rounded-full w-5 h-5"
                >
                  <MoreHorizontal size={10} />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="p-0 bg-white border border-blue-200 blur-in-sm blur-out-sm"
                side={isMobile ? "bottom" : "right"}
              >
                {/* 삭제 */}
                <DropdownMenuItem
                  onClick={() => deleteSession(session.id)}
                  className="border-none cursor-pointer hover:bg-red-100 "
                >
                  <Trash2 className="text-slate-500" />
                  <span>대화 삭제</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}

        {/* 대화가 없을 때 안내 문구 */}
        {sessions.length === 0 && (
          <div className="px-4 py-8 text-xs text-slate-400 text-center border-t border-dashed border-slate-200 mt-2">
            <p>대화 기록이 없습니다.</p>
            <p className="mt-1">새 채팅을 시작해보세요!</p>
          </div>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
