"use client";

import * as React from "react";
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Home,
  NotepadText,
} from "lucide-react";

import { NavMain } from "@/components/layout/Sidebar/navMain";
import { NavProjects } from "@/components/layout/Sidebar/navProjects";
import { NavUser } from "@/components/layout/Sidebar/navUser";
import { TeamSwitcher } from "@/components/layout/Sidebar/navSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "알랭",
    email: "tkddn@temp.com",
    avatar: "./alain_charLogo01_transparent.png",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "메인 기능",
      url: "/",
      icon: Home,
      items: [
        {
          title: "채팅",
          url: "/note",
        },
      ],
    },

    {
      title: "관리자 메뉴",
      url: "#",
      icon: NotepadText,
      items: [
        {
          title: "사용자 관리",
          url: "/User",
        },
        {
          title: "부서 및 프로젝트 관리",
          url: "/Manage",
        },
        {
          title: "문서 관리",
          url: "/Docs",
        },
        {
          title: "대시보드",
          url: "/dashboard",
        },
      ],
    },
  ],
  projects: [
    {
      name: "이 문서 읽고 분석해줘",
      url: "#",
    },
    {
      name: "첨부한 파일을 요약해줘",
      url: "#",
    },
    {
      name: "이번 분기 할당된 목표 수치를 그래프로 보여줘",
      url: "#",
    },
    {
      name: "문서 읽고 보안사항 말해줘",
      url: "#",
    },
    {
      name: "이거 수정을 어떻게 할까",
      url: "#",
    },
    {
      name: "10월 예산안 찾아줘",
      url: "#",
    },
    {
      name: "채팅 예시4",
      url: "#",
    },
    {
      name: "채팅 예시 2",
      url: "#",
    },
    {
      name: "채팅 예시 3",
      url: "#",
    },
    {
      name: "채팅 예시4",
      url: "#",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
