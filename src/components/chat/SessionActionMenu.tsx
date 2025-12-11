import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Loader2, Pin, PinOff } from "lucide-react"; // Pin 아이콘 추가

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import {
  deleteChatSession,
  updateChatSessionTitle,
} from "@/services/chat.service";
import { useDialogStore } from "@/store/dialogStore";
import { cn } from "@/lib/utils";

interface SessionActionMenuProps {
  sessionId: string;
  currentTitle: string;
  trigger: React.ReactNode;
  onOpenChange?: (open: boolean) => void;

  // 위치 제어용 Props 추가 (Optional)
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string; // 내부 컨텐츠 스타일 커스텀용
}

export function SessionActionMenu({
  sessionId,
  currentTitle,
  trigger,
  onOpenChange,
  side = "bottom",
  align = "end",
  sideOffset = 4,
  className,
}: SessionActionMenuProps) {
  const queryClient = useQueryClient();
  const dialog = useDialogStore();
  const { user } = useAuthStore();

  // [수정] pinnedSessionIds, toggleSessionPin 가져오기
  const {
    deleteSession,
    updateSessionTitle,
    selectedSessionId,
    setSelectedSessionId,
    pinnedSessionIds,
    toggleSessionPin,
  } = useChatStore();

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(currentTitle);

  const isPinned = pinnedSessionIds.includes(sessionId); // 현재 핀 상태 확인

  // 1. 삭제 Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteChatSession(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["chatSessions", user?.id] });
      deleteSession(id);
      if (selectedSessionId === id) {
        setSelectedSessionId(null);
      }
      dialog.alert({ message: "채팅방이 삭제되었습니다.", variant: "success" });
    },
    onError: () => {
      dialog.alert({ message: "삭제에 실패했습니다.", variant: "error" });
    },
  });

  // 2. 제목 수정 Mutation
  const updateTitleMutation = useMutation({
    mutationFn: (title: string) => updateChatSessionTitle(sessionId, title),
    onSuccess: (_, title) => {
      queryClient.invalidateQueries({ queryKey: ["chatSessions", user?.id] });
      updateSessionTitle(sessionId, title);
      setIsRenameDialogOpen(false);
      dialog.alert({ message: "제목이 수정되었습니다.", variant: "success" });
    },
    onError: () => {
      dialog.alert({ message: "제목 수정에 실패했습니다.", variant: "error" });
    },
  });

  const handleDeleteClick = async () => {
    const confirmed = await dialog.confirm({
      title: "채팅 삭제",
      message: "정말 이 채팅방을 삭제하시겠습니까?",
      variant: "warning",
    });
    if (confirmed) {
      deleteMutation.mutate(sessionId);
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newTitle === currentTitle) {
      setIsRenameDialogOpen(false);
      return;
    }
    updateTitleMutation.mutate(newTitle);
  };

  // [추가] 핀 토글 핸들러
  const handleTogglePin = () => {
    toggleSessionPin(sessionId);
    // 메뉴 닫힘 처리는 DropdownMenuItem이 자동으로 수행함
  };

  return (
    <>
      <DropdownMenu onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          className={cn(
            "w-36 justify-center  bg-neutral-50 flex flex-col font-medium",
            className
          )}
          side={side}
          sideOffset={sideOffset}
        >
          {/* 제목 수정 */}
          <div className="point-hover">
            <DropdownMenuItem
              onClick={() => {
                setNewTitle(currentTitle);
                setIsRenameDialogOpen(true);
              }}
            >
              <div className="flex p-1 gap-2 items-center px-4">
                <Pencil size={14} /> 제목 수정
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="border-b pb-1 border-blue-100" />
          </div>

          {/* [수정] 상단 고정 옵션 부활 */}
          <div className="point-hover">
            <DropdownMenuItem
              onClick={handleTogglePin}
              className="gap-2 flex items-center  point-hover"
            >
              <div className="flex gap-2 p-1 items-center px-4">
                {isPinned ? (
                  <>
                    <PinOff size={14} className="text-slate-500" />{" "}
                    <span className="text-slate-500">상단 고정 해제</span>
                  </>
                ) : (
                  <>
                    <Pin size={14} className="text-blue-500" />{" "}
                    <span className="text-blue-500">상단 고정</span>
                  </>
                )}
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="border-b pb-1 border-blue-100" />
          </div>

          <DropdownMenuItem
            onClick={handleDeleteClick}
            className="gap-2 flex items-center text-red-600 hover:bg-red-100 pb-1 cursor-pointer"
          >
            <div className="flex gap-2  p-1 items-center px-4">
              <Trash2 size={14} /> 삭제하기
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 제목 수정 모달 */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="bg-neutral-50">
          <DialogHeader>
            <DialogTitle>채팅방 제목 수정</DialogTitle>
            <DialogDescription>변경할 제목을 입력해 주세요.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit}>
            <div className="py-4">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="채팅방 제목"
                autoFocus
                className="border-blue-200"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsRenameDialogOpen(false)}
                className="cursor-pointer text-red-600 border border-red-200 hover:bg-red-100 shadow-md hover:shadow-sm shadow-red-300"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={updateTitleMutation.isPending}
                className="cursor-pointer text-blue-600 border border-blue-200 shadow-md hover:bg-blue-50 hover:shadow-sm shadow-blue-300"
              >
                {updateTitleMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                저장
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
