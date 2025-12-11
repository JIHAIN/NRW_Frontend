import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuthStore } from "@/store/authStore";
import { useSystemStore } from "@/store/systemStore";
import { LogOut, BadgeCheck } from "lucide-react";

// 드롭다운 및 아바타 컴포넌트 임포트
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// 내 정보 수정 모달 임포트 (경로 확인 필요, UserNavigation과 동일한 곳에서 가져옵니다)
import MyInfoModal from "@/components/layout/Sidebar/MyInfoModal";

const IMAGE_BASE_URL = "https://alain.r-e.kr";

function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { departments } = useSystemStore();

  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. 부서 이름 찾기
  const deptName = useMemo(() => {
    if (!user?.departmentId) return "부서 미배정";
    const dept = departments.find((d) => d.id === user.departmentId);
    return dept ? dept.dept_name : `부서 ${user.departmentId}`;
  }, [user, departments]);

  // 2. 프로필 이미지 URL 가공
  const profileUrl = useMemo(() => {
    if (!user?.profileImagePath) return "";
    if (user.profileImagePath.startsWith("http")) return user.profileImagePath;
    const fileName = user.profileImagePath.split("/").pop();
    if (!fileName) return "";
    return `${IMAGE_BASE_URL}/static/profile/${fileName}`;
  }, [user?.profileImagePath]);

  // 로그인 핸들러 (비로그인 시)
  const handleLogin = () => {
    navigate("/login");
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="w-full ">
      <nav className="z-50">
        <div className="h-14 px-4 flex items-center justify-between ">
          {/* 로고 영역 */}
          <div className="  p-0.5 ">
            <Link
              to="/"
              className="grid flex-1 p-1 text-sm leading-tight group-data-[collapsible=icon]:hidden"
            >
              <span className="truncate font-bold text-gray-500 text-[16px] ">
                NEURON WAY
              </span>
            </Link>
          </div>

          {/* 우측 영역 */}
          <div className="flex gap-6 items-center">
            {isAuthenticated && user ? (
              <>
                {/* [핵심 수정] DropdownMenu로 감싸서 기능 구현 */}
                <DropdownMenu>
                  {/* Trigger: 기존 텍스트 버튼 스타일 유지 */}
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="point-hover focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      <span className="text-[13px]">
                        안녕하세요{" "}
                        <span className="font-bold text-[15px] text-blue-600">
                          {user.userName}
                        </span>{" "}
                        님
                      </span>
                    </Button>
                  </DropdownMenuTrigger>

                  {/* Content: 사이드바와 동일한 내용, 위치는 하단(bottom)으로 고정 */}
                  <DropdownMenuContent
                    className="w-56 rounded-xl flex flex-col border border-slate-200 shadow-lg bg-white/95 backdrop-blur-sm"
                    side="bottom" // [요청 반영] 무조건 하단에 표시
                    align="end" // 오른쪽 정렬
                    sideOffset={8} // 버튼과의 간격
                  >
                    {/* 프로필 정보 영역 (UserNavigation 디자인 복사) */}
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex flex-col items-center gap-3 px-4 py-4 text-center bg-slate-50/50">
                        <Avatar className="h-20 w-20 rounded-full border-4 border-white shadow-sm">
                          <AvatarImage
                            src={profileUrl}
                            alt={user.userName}
                            className="object-cover"
                          />
                          <AvatarFallback className="rounded-full bg-blue-100 text-blue-500 text-2xl font-bold">
                            {user.userName.slice(0, 1) || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col gap-1 min-w-0 w-full">
                          <span className="truncate font-bold text-base text-slate-800">
                            {user.userName}
                          </span>
                          <span className="truncate text-xs text-slate-500 font-medium">
                            {deptName} / {user.role || "사용자"}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-slate-100 my-1" />

                    {/* 메뉴 아이템 */}
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

                {/* 내 정보 수정 모달 (Header 내부에 렌더링) */}
                {isModalOpen && (
                  <MyInfoModal onClose={() => setIsModalOpen(false)} />
                )}
              </>
            ) : (
              // 비로그인 상태
              <Button
                variant="ghost"
                onClick={handleLogin}
                className="point-hover text-[13px]"
              >
                로그인
              </Button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Header;
