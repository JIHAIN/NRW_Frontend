import "../index.css";

function App() {
  return (
    <div className="min-h-screen w-screen flex flex-col bg-white text-gray-800">
      {/* Header */}
      <header className="w-full shadow-sm p-0 border-b bg-white">
        <div className="w-[70%] mx-auto flex justify-between items-center p-4">
          <img src=" public/alain_textOnly2.png" className="w-30 h-10" />
          <nav className="flex gap-x-6 text-gray-600 font-bold  text-x">
            <a
              href="#home"
              className="transition-transform duration-150 hover:scale-130"
            >
              홈
            </a>
            <a
              href="#upload"
              className="transition-transform duration-150 hover:scale-130"
            >
              문서 업로드
            </a>
            <a
              href="#qa"
              className="transition-transform duration-150 hover:scale-130"
            >
              질의응답
            </a>
            <a
              href="#admin"
              className="transition-transform duration-150 hover:scale-130"
            >
              관리자
            </a>
          </nav>
          <button className="bg-blue-600 text-white  px-6 py-1 rounded-4xl transition-transform duration-150 hover:scale-110">
            로그인
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center py-16 px-4  from-blue-50 to-white">
        <h2 className="text-3xl font-bold mb-3 text-gray-900">
          문서를 올리면, 문서가 말해주는 AI
        </h2>
        <p className="max-w-xl text-gray-600 mb-6">
          HWPX 문서를 업로드하면 AlAin이 내용을 분석하고, 당신의 질문에 근거
          기반으로 답변합니다.
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
          문서 업로드 시작하기
        </button>
      </section>

      {/* Upload Section */}
      <section id="upload" className="w-[70%] h-full mx-auto p-8">
        <h3 className="text-2xl font-semibold mb-4">문서 업로드</h3>
        <div className="border-2 border-dashed border-blue-300 rounded-xl p-10 flex flex-col items-center justify-center text-gray-500">
          <p className="mb-2 font-medium">
            이곳에 .HWPX 파일을 드래그하거나 클릭하여 업로드하세요.
          </p>
          <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md">
            파일 선택
          </button>
        </div>
      </section>

      {/* Q&A Section */}
      <section id="qa" className=" border-t mt-8 py-10">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-semibold mb-6">질의응답</h3>
          <div className="border rounded-xl bg-white p-6 shadow-sm">
            <div className="h-64 overflow-y-auto border p-3 rounded-md mb-4 text-sm text-gray-700">
              <p className="text-gray-500 italic">
                AI가 답변을 여기에 표시합니다...
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="문서에 대해 질문해보세요..."
                className="flex-1 border rounded-md px-4 py-2"
              />
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md">
                전송
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t mt-10 py-6 text-center text-gray-500 text-sm bg-white">
        <p>© 2025 AlAin Project | Powered by OWPML & GPT</p>
      </footer>
    </div>
  );
}

export default App;
