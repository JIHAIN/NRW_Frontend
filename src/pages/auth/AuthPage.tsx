import SignInForm from "./components/SignInForm";

/**
 * 인증 페이지 (메인)
 * 현재는 로그인 기능만 제공합니다. (회원가입 제거됨)
 */
export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-blue-50 via-white to-white">
      <section className="w-full max-w-md bg-white border border-gray-100 shadow-xl rounded-3xl p-8 mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ALAIN</h1>
          <p className="text-sm text-gray-500 mt-2">
            시스템 이용을 위해 로그인이 필요합니다.
          </p>
        </div>

        {/* 로그인 폼 */}
        <SignInForm />

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            계정 생성 및 비밀번호 초기화는
            <br />
            <span className="font-semibold text-gray-600">총괄 관리자</span>에게
            문의해주세요.
          </p>
        </div>
      </section>
    </div>
  );
}
