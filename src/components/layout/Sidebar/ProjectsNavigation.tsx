"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Trash2, Plus, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom"; // useNavigate 추가
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
import { useAuthStore } from "@/store/authStore"; // AuthStore 추가
import { getChatSessions, deleteChatSession } from "@/services/chat.service";
import { useEffect } from "react";
import { useDialogStore } from "@/store/dialogStore";

export function ProjectsNavigation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dialog = useDialogStore();

  const {
    selectedSessionId,
    setSelectedSessionId,
    createSession,
    sessions: storeSessions,
  } = useChatStore();

  // [수정] 로그인한 유저 ID 가져오기
  const { user } = useAuthStore();
  const userId = user?.id;

  // 1. API 목록 가져오기 (userId가 있을 때만)
  const { data: apiSessions, isLoading } = useQuery({
    queryKey: ["chatSessions", userId],
    queryFn: () => getChatSessions(userId!),
    enabled: !!userId,
  });

  // API 목록을 Store와 동기화
  useEffect(() => {
    if (apiSessions && apiSessions.length > 0) {
      apiSessions.forEach((s) => {
        const strId = String(s.id);
        const exists = storeSessions.some((local) => local.id === strId);
        if (!exists) {
          createSession(strId, s.title);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiSessions]);

  // 2. 삭제 기능
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteChatSession(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["chatSessions", userId] });
      useChatStore.getState().deleteSession(String(deletedId));
      if (selectedSessionId === String(deletedId)) {
        setSelectedSessionId(null);
      }
      dialog.alert({ message: "삭제되었습니다.", variant: "success" });
    },
    onError: () => {
      dialog.alert({ message: "삭제에 실패했습니다.", variant: "error" });
    },
  });

  const handleDelete = async (id: number) => {
    const confirmed = await dialog.confirm({
      title: "채팅 삭제",
      message: "정말 삭제하시겠습니까?",
      variant: "warning",
    });
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  // [수정] 새 채팅 버튼 핸들러
  const handleNewChat = () => {
    setSelectedSessionId(null); // 세션 선택 해제
    navigate("/chat"); // 채팅 페이지로 이동 (자동으로 새 세션 준비됨)
  };

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between px-2 mb-2">
        <SidebarGroupLabel>채팅 목록</SidebarGroupLabel>
        <button
          onClick={handleNewChat}
          className="text-xs flex gap-1 items-center hover:text-blue-500 cursor-pointer text-gray-500"
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
