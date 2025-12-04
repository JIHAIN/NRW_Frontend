import React, { useState, memo } from "react";
import clsx from "clsx";
import { Eye, EyeOff } from "lucide-react";

//UserService (로컬스토리지)
type User = {
  email: string;
  nickname: string;
  department: string;
  password: string;
};

const UserService = {
  getUsers: (): Record<string, User> => {
    const saved = localStorage.getItem("users");
    return saved ? JSON.parse(saved) : {};
  },
  getUser: (email: string): User | undefined => {
    return UserService.getUsers()[email];
  },
  saveUser: (user: User) => {
    const users = UserService.getUsers();
    users[user.email] = user;
    localStorage.setItem("users", JSON.stringify(users));
  },
};

//공통 스타일 변수
const baseInputClass =
  "w-full rounded-xl border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200";

const baseButtonClass =
  "transition-colors duration-200 rounded-xl font-semibold cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:pointer-events-none";

const fieldWrapper = "flex flex-col gap-1";

//Auth Page
export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b  from-blue-50 via-white to-white">
      <section className="w-full max-w-md bg-white border shadow-sm rounded-2xl p-6">
        <div className="max-h-[80vh] overflow-y-auto scrollbar-width-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loggedInUser ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">
                {loggedInUser}님 환영합니다!
              </h2>
              <PrimaryButton
                type="button"
                onClick={() => setLoggedInUser(null)}
              >
                로그아웃
              </PrimaryButton>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-6">
                <TabButton
                  active={mode === "signin"}
                  onClick={() => setMode("signin")}
                >
                  로그인
                </TabButton>
                <TabButton
                  active={mode === "signup"}
                  onClick={() => setMode("signup")}
                >
                  회원가입
                </TabButton>
              </div>

              {mode === "signin" ? (
                <SignInForm onSuccess={(email) => setLoggedInUser(email)} />
              ) : (
                <SignUpForm switchToSignIn={() => setMode("signin")} />
              )}

              <p className="mt-6 text-xs text-gray-500 text-center pb-2">
                계속 진행하면 이용 약관과 개인정보 처리방침에 동의하는 것으로
                간주됩니다.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

//공통 컴포넌트
const TabButton = memo(function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        baseButtonClass,
        "px-4 py-2 text-sm",
        active
          ? "bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:hover:bg-gray-100"
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
});

const PrimaryButton = memo(function PrimaryButton({
  children,
  type = "submit",
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        baseButtonClass,
        "w-full py-2",
        !disabled && "bg-blue-600 text-white hover:bg-blue-700"
      )}
    >
      {children}
    </button>
  );
});

//Input Field
const InputField = memo(function InputField({
  label,
  id,
  type = "text",
  placeholder,
  autoComplete,
  value,
  onChange,
  onBlur,
  valid,
  errorText,
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id?: string;
  valid?: boolean | null;
  errorText?: string | null;
}) {
  const inputId = id || label;

  return (
    <div className={fieldWrapper}>
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        onChange={onChange}
        onBlur={onBlur}
        className={baseInputClass}
      />

      {valid === false && errorText && (
        <p className="text-xs text-red-500">{errorText}</p>
      )}
    </div>
  );
});

//Select Field
const SelectField = memo(function SelectField({
  label,
  id,
  value,
  onChange,
  onBlur,
  valid,
  errorText,
  children,
}: {
  label: string;
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: () => void;
  valid?: boolean | null;
  errorText?: string | null;
  children: React.ReactNode;
}) {
  const selectId = id || label;

  return (
    <div className={fieldWrapper}>
      <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <select
        id={selectId}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={baseInputClass}
      >
        {children}
      </select>

      {valid === false && errorText && (
        <p className="text-xs text-red-500">{errorText}</p>
      )}
    </div>
  );
});

//Password Input
const PasswordInput = memo(function PasswordInput({
  label,
  value,
  onChange,
  autoComplete = "current-password",
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={fieldWrapper}>
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          placeholder="••••••••"
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={clsx(baseInputClass, "pr-10")}
        />

        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="비밀번호 표시 토글"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
});

//유틸리티
const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function validatePassword(password: string) {
  return {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
}

function usePasswordValidation(password: string) {
  const checks = validatePassword(password);
  const allPassed = Object.values(checks).every(Boolean);
  return { checks, allPassed };
}

const PasswordStrength = memo(({ password }: { password: string }) => {
  const { checks } = usePasswordValidation(password);
  const fails = Object.keys(checks).filter(
    (k) => !checks[k as keyof typeof checks]
  );

  if (password.length === 0) return null;
  if (!fails.length) return null;

  return (
    <ul className="mt-1 text-xs text-red-500 space-y-0.5" aria-live="polite">
      {fails.includes("length") && <li>8자 이상</li>}
      {fails.includes("uppercase") && <li>대문자 포함</li>}
      {fails.includes("lowercase") && <li>소문자 포함</li>}
      {fails.includes("number") && <li>숫자 포함</li>}
      {fails.includes("special") && <li>특수문자 포함</li>}
    </ul>
  );
});

//로그인
const SignInForm = memo(function SignInForm({
  onSuccess,
}: {
  onSuccess: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const user = UserService.getUser(email);

    if (!user || user.password !== pw) {
      setError("등록된 계정이 없거나 비밀번호가 일치하지 않습니다.");
      return;
    }

    setError("");
    onSuccess(email);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
    >
      <InputField
        label="이메일"
        id="signin-email"
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <PasswordInput
        label="비밀번호"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <PrimaryButton disabled={!email || !pw}>로그인</PrimaryButton>
    </form>
  );
});

//회원가입 + 인증번호
const SignUpForm = memo(function SignUpForm({
  switchToSignIn,
}: {
  switchToSignIn: () => void;
}) {
  const [email, setEmail] = useState("");
  const [emailValid, setEmailValid] = useState<boolean | null>(null);

  const [sentCode, setSentCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [codeValid, setCodeValid] = useState<boolean | null>(null);

  const [nickname, setNickname] = useState("");
  const [nicknameValid, setNicknameValid] = useState<boolean | null>(null);

  const [department, setDepartment] = useState("");
  const [departmentValid, setDepartmentValid] = useState<boolean | null>(null);

  const [pw, setPw] = useState("");
  const pwCheck = usePasswordValidation(pw);

  const [confirm, setConfirm] = useState("");
  const [confirmValid, setConfirmValid] = useState<boolean | null>(null);

  const [agree, setAgree] = useState(false);

  const allFilled =
    emailValid &&
    codeValid &&
    nicknameValid &&
    departmentValid &&
    pwCheck.allPassed &&
    confirmValid &&
    agree;

  //인증번호 요청
  const sendVerificationCode = () => {
    if (UserService.getUser(email)) {
      alert("이미 등록된 이메일입니다.");
      return;
    }

    setInputCode(""); // 입력 초기화
    setCodeValid(null); // 검증 상태 초기화

    // 새 코드 생성
    const code = String(Math.floor(100000 + Math.random() * 900000));

    setSentCode(code);

    alert("인증번호가 발송되었습니다.\n\n(테스트용 인증번호: " + code + ")");
  };

  //인증번호 입력 체크
  const handleCodeInput = (value: string) => {
    if (!/^\d*$/.test(value)) return;

    setInputCode(value);
    setCodeValid(value === sentCode);
  };

  //회원가입 처리
  const handleSignup = () => {
    if (UserService.getUser(email)) {
      alert("이미 등록된 이메일입니다.");
      return;
    }

    UserService.saveUser({ email, nickname, department, password: pw });
    alert("회원가입 성공!");
    switchToSignIn();
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleSignup();
      }}
    >
      <InputField
        label="이메일"
        id="signup-email"
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setEmailValid(validateEmail(email))}
        valid={emailValid}
        errorText="유효하지 않은 이메일입니다."
      />

      <PrimaryButton
        type="button"
        disabled={!emailValid}
        onClick={sendVerificationCode}
      >
        인증번호 요청
      </PrimaryButton>

      {sentCode && (
        <InputField
          label="인증번호"
          placeholder="6자리 숫자"
          value={inputCode}
          onChange={(e) => handleCodeInput(e.target.value)}
          valid={codeValid}
          errorText="인증번호가 일치하지 않습니다."
        />
      )}

      <InputField
        label="닉네임"
        id="signup-nickname"
        placeholder="홍길동"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        onBlur={() => setNicknameValid(nickname.length >= 2)}
        valid={nicknameValid}
        errorText="닉네임은 2글자 이상이어야 합니다."
      />

      <SelectField
        label="부서"
        id="signup-department"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        onBlur={() => setDepartmentValid(department.length > 0)}
        valid={departmentValid}
        errorText="부서를 선택해주세요."
      >
        <option value="">부서를 선택하세요</option>
        <option value="개발">개발</option>
        <option value="디자인">디자인</option>
        <option value="마케팅">마케팅</option>
        <option value="영업">영업</option>
        <option value="인사">인사</option>
        <option value="재무">재무</option>
      </SelectField>

      <div>
        <PasswordInput
          label="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="new-password"
        />
        <PasswordStrength password={pw} />
      </div>

      <InputField
        label="비밀번호 확인"
        type="password"
        placeholder="••••••••"
        value={confirm}
        onChange={(e) => {
          setConfirm(e.target.value);
          setConfirmValid(pw === e.target.value);
        }}
        valid={confirmValid}
        errorText="비밀번호가 일치하지 않습니다."
      />

      <div className="flex items-center gap-2">
        <input
          id="agree"
          type="checkbox"
          className="rounded border-gray-300 cursor-pointer"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        <label htmlFor="agree" className="text-sm text-gray-700">
          약관 및 개인정보처리방침 동의
        </label>
      </div>

      <PrimaryButton disabled={!allFilled}>회원가입</PrimaryButton>

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
});
