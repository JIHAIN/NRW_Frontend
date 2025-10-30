import {
  Calendar,
  ChevronDown,
  Home,
  Inbox,
  MoreHorizontal,
  Search,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

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
    <Sidebar className="text-[14px] font-medium w-62">
      <SidebarHeader>
        <img src=" public/alain_textOnly2.png" className="w-15 h-5" />
      </SidebarHeader>
      <SidebarContent className="w-full">
        <SidebarGroup className="flex flex-col gap-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem
                  key={item.title}
                  className="border border-transparent hover:border-gray-300 hover:bg-gray-100 rounded-md"
                >
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* 채팅 메뉴쪽 */}
        {/* Collapsible 이게 사라지는 옵션 */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup className="flex flex-col">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                <p className="text-gray-500">채팅</p>
                <ChevronDown className=" transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            {/* 이게 사라질 목록 보여주는거 */}
            <CollapsibleContent>
              <SidebarMenu>
                <div className="flex flex-col gap-1.5">
                  {chat_itmes.map((item) => (
                    <SidebarMenuItem
                      key={item.title}
                      className="border border-transparent hover:border-gray-300 hover:bg-gray-100 rounded-md px-2"
                    >
                      {/* 오른쪽에 ... 이거 3개 붙이기 */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction>
                            <MoreHorizontal />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        {/* 여기는 사이드바 옵션에 들어갈 목록 */}
                        <DropdownMenuContent
                          side="right"
                          align="start"
                          className="flex flex-col bg-white"
                        >
                          <DropdownMenuItem>
                            <span>공유하기</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <span>수정하기</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <span>삭제하기</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                        {/* 이게 채팅 내역 들어갈 변수 */}
                        <button className="h-7">{item.title}</button>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ))}
                </div>
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        {/* 이거는 하나 더 만들어본 테스트용 */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup className="flex flex-col">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                <p className="text-gray-500 ">테스트</p>
                <ChevronDown className=" transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            {/* 이게 사라질 목록 보여주는거 */}
            <CollapsibleContent>
              <SidebarMenu>
                <div className="flex flex-col">
                  {chat_itmes.map((item) => (
                    <SidebarMenuItem
                      key={item.title}
                      className="border border-transparent hover:border-gray-300 hover:bg-gray-100 rounded-md px-2"
                    >
                      {/* 오른쪽에 ... 이거 3개 붙이기 */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction>
                            <MoreHorizontal />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        {/* 여기는 사이드바 옵션에 들어갈 목록 */}
                        <DropdownMenuContent
                          side="right"
                          align="start"
                          className="flex flex-col bg-white"
                        >
                          <DropdownMenuItem>
                            <span>공유하기</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <span>수정하기</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <span>삭제하기</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                        {/* 이게 채팅 내역 들어갈 변수 */}
                        <button className="h-7">{item.title}</button>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ))}
                </div>
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        {/* 이거까지 테스트 코드 */}
      </SidebarContent>
      <SidebarFooter className="w-full">테스트</SidebarFooter>
    </Sidebar>
  );
}
