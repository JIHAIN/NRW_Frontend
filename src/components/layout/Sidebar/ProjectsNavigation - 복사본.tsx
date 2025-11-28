"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Trash2, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useChatStore } from "@/store/chatStore";
import { getChatSessions, deleteChatSession } from "@/services/chat.service";
import { useEffect } from "react";

export function ProjectsNavigation() {
  const queryClient = useQueryClient();
  const {
    currentSessionId,
    selectSession,
    clearCurrentSession,
    createSession,
    sessions: storeSessions,
  } = useChatStore();
  const USER_ID = 1; // 임시 ID

  // 1. API 목록 가져오기
  const { data: apiSessions, isLoading } = useQuery({
    queryKey: ["chatSessions", USER_ID],
    queryFn: () => getChatSessions(USER_ID),
  });

  // [추가] API에서 가져온 세션 목록을 Store와 동기화 (최초 로드 시 등)
  useEffect(() => {
    if (apiSessions) {
      apiSessions.forEach((s) => {
        // 이미 스토어에 없는 경우만 추가 (단순화된 로직)
        const exists = storeSessions.some((local) => local.id === String(s.id));
        if (!exists) {
          createSession(String(s.id), s.title);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiSessions]);

  // 2. 삭제 기능
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteChatSession(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["chatSessions"] });

      // Store에서도 삭제
      useChatStore.getState().deleteSession(String(deletedId));

      if (currentSessionId === String(deletedId)) {
        clearCurrentSession();
      }
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("삭제하시겠습니까?")) deleteMutation.mutate(id);
  };

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between px-2 mb-2">
        <SidebarGroupLabel>채팅 목록</SidebarGroupLabel>
        <button
          onClick={clearCurrentSession}
          className="text-xs flex gap-1 items-center hover:text-blue-500"
        >
          <Plus size={14} /> 새 채팅
        </button>
      </div>

      <SidebarMenu>
        {isLoading && (
          <Loader2 className="animate-spin mx-auto my-4 text-slate-400" />
        )}

        {/* API 데이터를 기준으로 리스트 렌더링 */}
        {apiSessions?.map((session) => (
          <SidebarMenuItem key={session.id}>
            <SidebarMenuButton
              asChild
              isActive={String(session.id) === currentSessionId}
            >
              <Link
                to="/chat"
                onClick={() => selectSession(String(session.id))}
              >
                <MessageSquare />
                <span className="truncate">{session.title}</span>
              </Link>
            </SidebarMenuButton>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <Trash2 size={14} />
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleDelete(session.id)}>
                  삭제하기
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
