import React, { useState } from "react";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gradient-to-br from-blue-50 via-white to-white">
      {/* Left: Brand / Message */}
      <section className="hidden lg:flex flex-col justify-between p-12 bg-white border-r">
        <div>
          <img src="/public/alain_textOnly2.png" alt="AlAin" className="h-10" />
          <h1 className="mt-10 text-4xl font-bold text-gray-900">
            문서를 올리면, 문서가 말해주는 AI
          </h1>
          <p className="mt-4 text-gray-600">
            HWPX 문서를 업로드하고 근거 기반 답변을 받아보세요. 로그인 후
            시작됩니다.
          </p>
        </div>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• 기업 대상 RBAC 기반 접근 제어</li>
          <li>• OWPML 기반 구조적 파싱</li>
          <li>• RAG 검색 + 근거 하이라이트</li>
        </ul>
      </section>

      {/* Right: Auth Card */}
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border shadow-sm rounded-2xl p-6">
          {/* Mode Switch */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setMode("signin")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-transform ${
                mode === "signin"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:scale-105"
              }`}
              aria-pressed={mode === "signin"}
            >
              로그인
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-transform ${
                mode === "signup"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:scale-105"
              }`}
              aria-pressed={mode === "signup"}
            >
              회원가입
            </button>
          </div>

          {/* Form */}
          {mode === "signin" ? (
            <SignInForm />
          ) : (
            <SignUpForm switchToSignIn={() => setMode("signin")} />
          )}

          {/* Terms / Footer */}
          <p className="mt-6 text-xs text-gray-500 text-center">
            계속 진행하면 서비스 이용약관과 개인정보 처리방침에 동의하는 것으로
            간주됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}

function SignInForm() {
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          이메일
        </label>
        <input
          type="email"
          placeholder="you@company.com"
          className="mt-1 w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          required
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            비밀번호
          </label>
          <a href="#" className="text-xs text-blue-600 hover:underline">
            비밀번호 찾기
          </a>
        </div>
        <input
          type="password"
          placeholder="••••••••"
          className="mt-1 w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold"
      >
        로그인
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-2">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-400">또는</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      {/* Social placeholders (옵션) */}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="border rounded-xl py-2 text-sm">
          Google
        </button>
        <button type="button" className="border rounded-xl py-2 text-sm">
          GitHub
        </button>
      </div>
    </form>
  );
}

function SignUpForm({ switchToSignIn }: { switchToSignIn: () => void }) {
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          이메일
        </label>
        <input
          type="email"
          placeholder="you@company.com"
          className="mt-1 w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          닉네임
        </label>
        <input
          type="text"
          placeholder="홍길동"
          className="mt-1 w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          minLength={2}
          maxLength={20}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          비밀번호
        </label>
        <input
          type="password"
          placeholder="8~32자, 영문/숫자 조합"
          className="mt-1 w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          minLength={8}
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          대·소문자/숫자 중 2종 이상 권장
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="agree"
          type="checkbox"
          className="rounded border-gray-300"
          required
        />
        <label htmlFor="agree" className="text-sm text-gray-700">
          약관 및 개인정보처리방침 동의
        </label>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold"
      >
        회원가입
      </button>

      <p className="text-sm text-gray-600 text-center">
        이미 계정이 있나요?{" "}
        <button
          type="button"
          onClick={switchToSignIn}
          className="text-blue-600 hover:underline"
        >
          로그인
        </button>
      </p>
    </form>
  );
}
