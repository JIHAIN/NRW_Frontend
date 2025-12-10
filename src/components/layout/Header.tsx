import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuthStore } from "@/store/authStore";

function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const handleUser = () => {
    if (isAuthenticated) {
      // 로그인 상태면 유저정보로
      navigate("/user");
    } else {
      // 아니면 로그인 페이지로
      navigate("/login");
    }
  };

  return (
    <div className="w-full">
      {/* 1. Navigation */}
      <nav className="z-50">
        <div className=" h-14 flex items-center justify-end">
          {/* 버튼 영역 (오른쪽) */}
          <div className=" flex gap-6 mr-10">
            {/* 로그인이 안 되어 있을 때만 '로그인' 버튼 표시 */}

            <Button
              variant="ghost"
              onClick={handleUser}
              className="point-hover "
            >
              {isAuthenticated ? (
                <span className="text-[13px]">
                  안녕하세요{" "}
                  <span className="font-bold text-[15px] text-blue-600">
                    {user?.userName}
                  </span>{" "}
                  님
                </span>
              ) : (
                "로그인"
              )}
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Header;
