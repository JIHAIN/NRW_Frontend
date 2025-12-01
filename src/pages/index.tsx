import "../index.css";

// 서비스 소개 페이지
import { useNavigate } from "react-router-dom";
import {
  Bot,
  FileText,
  ShieldCheck,
  Search,
  Zap,
  ArrowRight,
  LayoutDashboard,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    // 로그인 페이지나 메인 대시보드로 이동
    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100">
      {/* 1. Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-700">
            <Bot className="size-7" />
            <span>ALAiN</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              로그인
            </Button>
            <Button
              onClick={handleStart}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              시작하기
            </Button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            AI 기반 사내 지식 관리 시스템
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            흩어진 문서들을 <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500">
              하나의 지능형 지식
            </span>
            으로
          </h1>

          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            HWP, PDF 등 다양한 포맷의 문서를 자동으로 파싱하고 벡터화합니다.{" "}
            <br className="hidden md:block" />
            ALAiN에게 질문하면, 수천 장의 문서 속에서 정확한 답변과 출처를
            찾아드립니다.
          </p>

          <div className="flex justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Button
              onClick={handleStart}
              size="lg"
              className="h-14 px-8 text-lg rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:scale-105"
            >
              무료로 시작하기 <ArrowRight className="ml-2 size-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 text-lg rounded-full border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              기능 살펴보기
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Feature Grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              강력한 기능, 직관적인 경험
            </h2>
            <p className="text-slate-500">
              복잡한 문서 관리 업무를 AI와 함께 효율적으로 처리하세요.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                <Search className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                RAG 기반 정밀 검색
              </h3>
              <p className="text-slate-500 leading-relaxed">
                단순 키워드 매칭이 아닌 의미 기반 검색(Semantic Search)을
                제공합니다. 질문의 의도를 파악하여 가장 연관성 높은 문서를
                찾아냅니다.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600">
                <FileText className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                HWP/PDF 자동 파싱
              </h3>
              <p className="text-slate-500 leading-relaxed">
                공공기관 및 기업에서 많이 쓰이는 HWP 파일을 완벽하게 지원합니다.
                드래그 앤 드롭만으로 텍스트 추출부터 벡터 저장까지 자동화됩니다.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 text-emerald-600">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                권한 관리 및 승인
              </h3>
              <p className="text-slate-500 leading-relaxed">
                부서 및 프로젝트 단위의 접근 제어를 지원합니다. 일반 사용자의
                업로드 요청을 관리자가 검토하고 승인하는 안전한 프로세스를
                제공합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Detail Sections */}
      <section className="py-24 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 text-blue-600 font-semibold">
              <LayoutDashboard className="size-5" />
              <span>관리자 대시보드</span>
            </div>
            <h2 className="text-4xl font-bold text-slate-900">
              한눈에 파악하고
              <br />
              손쉽게 관리하세요
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              부서별, 프로젝트별 문서 현황을 실시간으로 모니터링할 수 있습니다.
              요청된 문서의 승인/반려 처리를 직관적인 UI로 제공하여 관리자의
              업무 부담을 줄여줍니다.
            </p>
            <ul className="space-y-3 pt-2">
              {[
                "직관적인 문서 상태 모니터링 (대기/완료/실패)",
                "부서 및 프로젝트별 필터링 조회",
                "요청 사유 및 반려 사유 관리 시스템",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700">
                  <CheckCircleIcon />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* 이미지 플레이스홀더 (실제 스크린샷을 넣으면 좋습니다) */}
          <div className="flex-1 relative">
            <div className="absolute -inset-4 bg-linear-to-r from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-30"></div>
            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 aspect-video flex items-center justify-center text-slate-300">
              {/* 여기에 실제 대시보드 스크린샷 이미지 태그를 넣으세요 */}
              <LayoutDashboard className="size-24 opacity-20" />
              <span className="absolute mt-20 font-medium">
                Admin Dashboard UI
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row-reverse items-center gap-16">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 text-orange-600 font-semibold">
              <UploadCloud className="size-5" />
              <span>스마트 업로드 시스템</span>
            </div>
            <h2 className="text-4xl font-bold text-slate-900">
              중단 없는
              <br />
              백그라운드 처리
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              파일을 업로드하는 동안 기다릴 필요가 없습니다. 대용량 파일도
              백그라운드에서 안정적으로 처리되며, 실시간 진행률과 처리 상태를
              어디서든 확인할 수 있습니다.
            </p>
            <ul className="space-y-3 pt-2">
              {[
                "다중 파일 동시 업로드 지원",
                "실시간 파싱 진행률 시각화",
                "업로드 중에도 자유로운 페이지 이동",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700">
                  <CheckCircleIcon />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 relative">
            <div className="absolute -inset-4 bg-linear-to-r from-orange-100 to-amber-100 rounded-full blur-3xl opacity-30"></div>
            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 aspect-video flex items-center justify-center text-slate-300">
              {/* 여기에 업로드 모달 스크린샷 */}
              <Zap className="size-24 opacity-20" />
              <span className="absolute mt-20 font-medium">
                Smart Upload System
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl text-white">
            <Bot className="size-6" />
            <span>ALAiN</span>
          </div>
          <div className="text-sm text-slate-500">
            © 2025 ALAiN Project. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// 체크 아이콘 컴포넌트
function CheckCircleIcon() {
  return (
    <div className="shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
      <svg
        className="w-3 h-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>
  );
}
