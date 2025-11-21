"use client";

import * as React from "react";
import { Home, UserCog2 } from "lucide-react";

import { MainNavigation } from "@/components/layout/Sidebar/MainNavigation";
import { ProjectsNavigation } from "@/components/layout/Sidebar/ProjectsNavigation";
import { UserNavigation } from "@/components/layout/Sidebar/UserNavigation";
import { TeamSwitcher } from "@/components/layout/Sidebar/TeamSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/authStore";

const data = {
  navMain: [
    {
      title: "채팅 및 문서관리",
      url: "/",
      icon: Home,
      roles: ["user", "manager", "super_admin"],
      items: [
        {
          title: "채팅",
          url: "/chat",
        },
        {
          title: "문서 관리",
          url: "/admin/docs",
        },
      ],
    },

    {
      title: "관리자 메뉴",
      url: "#",
      icon: UserCog2,
      // 관리자만 열람 가능
      roles: ["manager", "super_admin"],
      items: [
        {
          title: "사용자 관리",
          url: "/admin/user",
        },
        {
          title: "부서 및 프로젝트 관리",
          url: "/admin/project",
        },

        // {
        //   title: "대시보드",
        //   url: "/admin/dashboard",
        // },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();

  // 1. user.role이 있으면 소문자로 변환(toLowerCase), 없으면 "user"
  const userRole = user?.role ? user.role.toLowerCase() : "user";

  // useMemo를 사용하여 role이 바뀔 때만 다시 계산
  const filteredNavMain = React.useMemo(() => {
    return data.navMain.filter((item) => {
      // 데이터에 정의된 roles 배열에 현재 내 role이 포함되어 있는지 확인
      // (만약 데이터에 roles가 없다면 기본적으로 보여줌)
      return item.roles ? item.roles.includes(userRole) : true;
    });
  }, [userRole]);

  // 3. 사이드바 하단에 표시할 유저 정보 객체 생성
  const currentUser = {
    name: `${user?.accountId} 계정`, // 실제 이름이 있다면 그것을 사용 (현재는 role로 대체)
    email: `${user?.departmentId} / ${user?.projectId || "프로젝트 없음"}`, // 부서/프로젝트 표시
    avatar: "/bat.gif", // 아바타는 고정 (나중에 DB에서 가져오면 변경)
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <MainNavigation items={filteredNavMain} />
        <ProjectsNavigation />
      </SidebarContent>
      <SidebarFooter>
        <UserNavigation user={currentUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
