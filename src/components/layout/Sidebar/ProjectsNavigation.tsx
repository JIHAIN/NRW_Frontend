"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Plus,
  Loader2,
  MoreHorizontal,
  Pin,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar";

import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { getChatSessions } from "@/services/chat.service";
import { SessionActionMenu } from "@/components/chat/SessionActionMenu";

export function ProjectsNavigation() {
  const navigate = useNavigate();

  const {
    selectedSessionId,
    setSelectedSessionId,
    createSession,
    updateSessionTitle,
    sessions: storeSessions,
    pinnedSessionIds,
  } = useChatStore();

  const { user } = useAuthStore();
  const userId = user?.id;

  // 2. API 목록 가져오기 및 동기화 로직은 기존과 동일

  const { data: apiSessions, isLoading } = useQuery({
    queryKey: ["chatSessions", userId],
    queryFn: () => getChatSessions(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (apiSessions) {
      apiSessions.forEach((apiSess) => {
        const strId = String(apiSess.id);
        const localSession = storeSessions.find((s) => s.id === strId);

        if (!localSession) {
          createSession(strId, apiSess.title);
        } else if (localSession.title !== apiSess.title) {
          updateSessionTitle(strId, apiSess.title);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiSessions]);

  const sortedSessions = useMemo(() => {
    return [...storeSessions].sort((a, b) => {
      const isAPinned = pinnedSessionIds.includes(a.id);
      const isBPinned = pinnedSessionIds.includes(b.id);

      if (isAPinned && !isBPinned) return -1;
      if (!isAPinned && isBPinned) return 1;
      return 0;
    });
  }, [storeSessions, pinnedSessionIds]);

  const handleNewChat = () => {
    setSelectedSessionId(null);
    navigate("/chat");
  };

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between px-2 mb-2">
        <SidebarGroupLabel>채팅 목록</SidebarGroupLabel>
        <button
          onClick={handleNewChat}
          className="text-xs flex gap-1 items-center hover:text-blue-500 cursor-pointer text-gray-500 transition-colors rounded-xl  hover:py-1 hover:bg-blue-50"
        >
          <Plus size={14} /> 새 채팅
        </button>
      </div>

      <SidebarMenu>
        {isLoading && (
          <div className="flex justify-center py-2">
            <Loader2 className="animate-spin text-slate-300 w-4 h-4" />
          </div>
        )}

        {sortedSessions.map((session) => {
          const isPinned = pinnedSessionIds.includes(session.id);
          return (
            <SidebarMenuItem key={session.id}>
              <SidebarMenuButton
                isActive={session.id === selectedSessionId}
                className="group-data-[collapsible=icon]:justify-center hover:bg-blue-100 cursor-pointer"
                tooltip={session.title}
              >
                <Link
                  to="/chat"
                  onClick={() => setSelectedSessionId(session.id)}
                  className="flex items-center gap-2 w-full overflow-hidden"
                >
                  <MessageSquare
                    size={14}
                    className="shrink-0 text-slate-500"
                  />
                  <span className="truncate text-sm flex-1">
                    {session.title}
                  </span>
                  {isPinned && (
                    <Pin
                      size={10}
                      className="shrink-0 text-blue-500 fill-blue-500"
                    />
                  )}
                </Link>
              </SidebarMenuButton>

              <SessionActionMenu
                sessionId={session.id}
                currentTitle={session.title}
                trigger={
                  <SidebarMenuAction
                    showOnHover
                    className="cursor-pointer hover:bg-blue-100 rounded-full p-1"
                  >
                    <MoreHorizontal />
                  </SidebarMenuAction>
                }
              />
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
