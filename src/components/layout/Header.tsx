import { Link } from "react-router-dom";

function Header() {
  return (
    <div className="w-full flex flex-col">
      <header className="w-full ">
        <div className=" mx-auto flex justify-between items-center px-4 h-[5vh]   ">
          <Link to="/auth/login_signup">
            <button className=" bg-blue-500 text-white text-[14px] px-3 rounded-2xl transition-transform duration-100 cursor-pointer hover:scale-110">
              로그인
            </button>
          </Link>
        </div>
      </header>
    </div>
  );
}

export default Header;
