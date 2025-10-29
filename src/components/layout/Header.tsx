import { Link } from "react-router-dom";
import { SidebarTrigger } from "../ui/sidebar";

function Header() {
  return (
    <div className="w-full  flex flex-col  text-gray-800">
      <header className="w-full ">
        <div className=" mx-auto flex justify-between items-center p-4">
          <SidebarTrigger />
          <Link to="/auth/login_signup">
            <button className=" bg-blue-600 text-white px-6 py-1 rounded-4xl transition-transform duration-150 hover:scale-110">
              로그인
            </button>
          </Link>
        </div>
      </header>
    </div>
  );
}

export default Header;
