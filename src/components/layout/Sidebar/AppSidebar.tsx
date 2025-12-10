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
import { useSystemStore } from "@/store/systemStore";

const IMAGE_BASE_URL = "https://alain.r-e.kr";

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
          url: "/docs",
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
        {
          title: "요청 목록",
          url: "/admin/request",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();
  const { departments } = useSystemStore(); // 부서 목록 가져오기

  const userRole = user?.role ? user.role.toLowerCase() : "user";

  const filteredNavMain = React.useMemo(() => {
    return data.navMain.filter((item) => {
      return item.roles ? item.roles.includes(userRole) : true;
    });
  }, [userRole]);

  // [수정] 부서 ID를 이용해 부서 이름 찾기
  const deptName = React.useMemo(() => {
    if (!user?.departmentId) return "부서 미배정";
    const dept = departments.find((d) => d.id === user.departmentId);
    return dept ? dept.dept_name : `부서 ${user.departmentId}`;
  }, [user, departments]);

  const profileUrl = React.useMemo(() => {
    if (!user?.profileImagePath) return "";

    // 1. 이미 http로 시작하는 완전한 URL인 경우 그대로 사용
    if (user.profileImagePath.startsWith("http")) return user.profileImagePath;

    // 2. 서버 내부 경로인 경우 파일명만 추출하여 웹 경로로 재조립
    // 예: "/app/app/data/profile/8_agumon.jpg" -> "8_agumon.jpg"
    const fileName = user.profileImagePath.split("/").pop();

    if (!fileName) return "";

    // 웹 접근 가능한 정적 경로로 변환
    return `${IMAGE_BASE_URL}/static/profile/${fileName}`;
  }, [user?.profileImagePath]);

  // [수정] 현재 유저 정보 표시 객체
  const currentUser = {
    // 이제 user.userName이 매핑되어 있으므로 정상 출력됨
    name: user?.userName || ` 이름 없음`,
    email: `${deptName} / ${user?.role || "사용자"}`, // 부서명과 직급 표시
    avatar: profileUrl,
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
