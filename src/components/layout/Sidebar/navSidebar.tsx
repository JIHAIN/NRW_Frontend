"use client";

import * as React from "react";
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  BookCheckIcon,
  Home,
  NotepadText,
  LayoutDashboardIcon,
  MessageCircle,
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
      title: "임시 라우터",
      url: "/",
      icon: Home,
      items: [
        {
          title: "메인",
          url: "/",
        },
        {
          title: "대시보드",
          url: "/dashboard",
        },
        {
          title: "채팅",
          url: "/chat",
        },
        {
          title: "문서관리",
          url: "/docs",
        },
      ],
    },

    {
      title: "우리 사업부",
      url: "#",
      icon: BookCheckIcon,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "프로젝트 / 기안",
      url: "#",
      icon: NotepadText,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
    {
      title: "대시보드",
      url: "#",
      icon: LayoutDashboardIcon,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
    {
      title: "새 채팅",
      url: "#",
      icon: MessageCircle,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
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

export function AppSidebar2({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
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
