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
  // store의 createSession 대신, 상태를 직접 제어하거나 동기화 로직 사용
  const {
    selectedSessionId,
    setSelectedSessionId,
    createSession,
    sessions: storeSessions,
  } = useChatStore();
  const USER_ID = 1;

  // 1. API 목록 가져오기
  const { data: apiSessions, isLoading } = useQuery({
    queryKey: ["chatSessions", USER_ID],
    queryFn: () => getChatSessions(USER_ID),
  });

  // [수정] API 목록을 Store와 강력 동기화
  useEffect(() => {
    if (apiSessions && apiSessions.length > 0) {
      apiSessions.forEach((s) => {
        const strId = String(s.id);
        const exists = storeSessions.some((local) => local.id === strId);
        // 스토어에 없는 방이면 새로 생성해둡니다.
        if (!exists) {
          createSession(strId, s.title);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiSessions]);
  // storeSessions를 의존성에 넣으면 무한루프 돌 수 있으므로 뺍니다.

  // 2. 삭제 기능
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteChatSession(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["chatSessions"] });
      useChatStore.getState().deleteSession(String(deletedId));
      if (selectedSessionId === String(deletedId)) {
        setSelectedSessionId(null);
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
          onClick={() => setSelectedSessionId(null)}
          className="text-xs flex gap-1 items-center hover:text-blue-500"
        >
          <Plus size={14} /> 새 채팅
        </button>
      </div>

      <SidebarMenu>
        {isLoading && (
          <Loader2 className="animate-spin mx-auto my-4 text-slate-400" />
        )}

        {apiSessions?.map((session) => (
          <SidebarMenuItem key={session.id}>
            {/* [수정] asChild 제거 및 span으로 감싸서 버튼 중첩 오류 해결 */}
            <SidebarMenuButton
              isActive={String(session.id) === selectedSessionId}
              className="data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700"
            >
              <Link
                to="/chat"
                onClick={() => setSelectedSessionId(String(session.id))}
                className="flex items-center gap-2 w-full overflow-hidden"
              >
                <MessageSquare size={12} className="shrink-0" />
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
