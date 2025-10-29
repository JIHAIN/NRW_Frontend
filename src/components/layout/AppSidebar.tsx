import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

// Menu items.
const items = [
  {
    title: "홈",
    url: "/",
    icon: Home,
  },
  {
    title: "문서관리",
    url: "/docs",
    icon: Inbox,
  },
  {
    title: "대시보드",
    url: "/dashboard",
    icon: Calendar,
  },
  {
    title: "연습채팅",
    url: "/chat",
    icon: Search,
  },
  {
    title: "설정",
    url: "#",
    icon: Settings,
  },
];

const chat_itmes = [
  {
    title: "질문 내용",
    log: "뭐 저장하지,, 뭐 이 질문기록 주소?",
  },
  {
    title: "질문 내용2",
    log: "뭐 저장하지,, 뭐 이 질문기록 주소?",
  },
  {
    title: "질문 내용3",
    log: "뭐 저장하지,, 뭐 이 질문기록 주소?",
  },
  {
    title: "질문 내용4",
    log: "뭐 저장하지,, 뭐 이 질문기록 주소?",
  },
  {
    title: "질문 내용5",
    log: "뭐 저장하지,, 뭐 이 질문기록 주소?",
  },
  {
    title: "질문 내용6",
    log: "뭐 저장하지,, 뭐 이 질문기록 주소?",
  },
  {
    title: "질문 내용7",
    log: "뭐 저장하지,, 뭐 이 질문기록 주소?",
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="font-semibold">
      <SidebarContent>
        <SidebarGroup className="flex flex-col gap-1 m-1">
          <SidebarGroupLabel>
            <img src=" public/alain_textOnly2.png" className="w-15 h-5" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <div className="flex flex-col gap-3 text-shadow-2xl">
                <p className="text-gray-500 text-xl pb-3 ">채팅</p>
                {chat_itmes.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <span>{item.title}</span>
                  </SidebarMenuItem>
                ))}
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
