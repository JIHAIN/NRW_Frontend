import { Link } from "react-router-dom";

function Header() {
  return (
    <div className="w-full flex flex-col">
      <header className="w-full">
        <div className=" mx-auto flex justify-between items-center px-4 pt-2 h-[46px]">
          <Link to="/">
            <img src="./alain_textOnly2.png" className="h-7 cursor-pointer" />
          </Link>
          <Link to="/auth/login_signup">
            <button className=" bg-blue-400 text-white px-6 py-1 rounded-xl transition-transform duration-150 cursor-pointer hover:scale-110">
              로그인
            </button>
          </Link>
        </div>
      </header>
    </div>
  );
}

export default Header;
