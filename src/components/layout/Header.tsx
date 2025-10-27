import { Link } from "react-router-dom";

function Header() {
  return (
    <div className="w-screen flex flex-col bg-white text-gray-800">
      <header className="w-full shadow-sm p-0 border-b bg-white">
        <div className="w-[70%] mx-auto flex justify-between items-center p-4">
          <img src=" public/alain_textOnly2.png" className="w-30 h-10" />
          <nav className="flex gap-x-6 text-gray-600 font-bold  text-x">
            <Link to="/">
              <button className="transition-transform duration-150 hover:scale-130">
                홈
              </button>
            </Link>
            <Link to="/chat">
              <button className="transition-transform duration-150 hover:scale-130">
                연습 채팅
              </button>
            </Link>
            <Link to="/DashBoard">
              <button className="transition-transform duration-150 hover:scale-130">
                대시보드
              </button>
            </Link>
            <button className="transition-transform duration-150 hover:scale-130">
              관리자
            </button>
          </nav>
          <Link to="/auth/login_signup">
            <button className=" bg-blue-600 text-white shadow-xl/50 shadow-blue-400/80  px-6 py-1 rounded-4xl transition-transform duration-150 hover:scale-110">
              로그인
            </button>
          </Link>
        </div>
      </header>
    </div>
  );
}

export default Header;
