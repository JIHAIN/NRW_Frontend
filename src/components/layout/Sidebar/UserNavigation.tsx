"use client";

import { useState } from "react";
import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/hooks/useSidebar";
import { useAuthStore } from "@/store/authStore";
import MyInfoModal from "./MyInfoModal";

export function UserNavigation({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * 로그아웃 핸들러
   */
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="point-hover">
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-8 w-8 rounded-lg border border-slate-200">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg bg-neutral-100 text-neutral-500">
                      <UserIcon size={16} />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col flex-1 text-left min-w-0 gap-0.5">
                    <span className="truncate font-semibold text-sm text-slate-800">
                      {user.name}
                    </span>
                    <span className="truncate text-xs text-slate-500">
                      {user.email}
                    </span>
                  </div>

                  <ChevronsUpDown className="ml-auto size-4 text-slate-400 shrink-0" />
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width)flex flex-col  min-w-56 rounded-xl border border-slate-200 shadow-lg bg-white/95 backdrop-blur-sm"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={-80}
            >
              {/* [수정] 라벨 영역: 세로 배치 적용 (flex-col) */}
              <DropdownMenuLabel className="p-0 font-normal ">
                <div className="flex flex-col items-center gap-3 px-4 py-4 text-center bg-slate-50/50">
                  {/* 프로필 이미지 크게 */}
                  <Avatar className="h-20 w-20 rounded-full border-4 border-white shadow-sm">
                    {/* user.avatar 값 사용 */}
                    <AvatarImage
                      src={user.avatar}
                      alt={user.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-full bg-blue-100 text-blue-500 text-2xl font-bold">
                      {user.name.slice(0, 1) || "U"}
                    </AvatarFallback>
                  </Avatar>

                  {/* 이름 및 이메일(부서) */}
                  <div className="flex flex-col gap-1 min-w-0 w-full">
                    <span className="truncate font-bold text-base text-slate-800">
                      {user.name}
                    </span>
                    <span className="truncate text-xs text-slate-500 font-medium">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-slate-100 my-1" />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="point-hover flex gap-3 p-2 text-[0.95rem] font-medium cursor-pointer items-center text-slate-600 focus:bg-slate-50 focus:text-blue-600"
                  onClick={() => setIsModalOpen(true)}
                >
                  <BadgeCheck className="h-4 w-4" />내 정보 관리
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-slate-100 my-1" />

              <DropdownMenuItem
                className="point-hover gap-3 flex p-2 text-[0.95rem] font-medium cursor-pointer items-center text-red-600 focus:bg-red-50 focus:text-red-700"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* 내 정보 수정 모달 */}
      {isModalOpen && <MyInfoModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
