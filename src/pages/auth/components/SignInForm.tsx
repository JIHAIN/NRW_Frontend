import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useDialogStore } from "@/store/dialogStore";
import { useDocumentStore } from "@/store/documentStore";
import { useChatStore } from "@/store/chatStore";
import { loginAPI } from "@/services/auth.service";
import { InputField, PasswordInput, PrimaryButton } from "./AuthFields";
import { Loader2 } from "lucide-react";
import { getMyInfoAPI } from "@/services/user.service";

/**
 * 로그인 폼 컴포넌트
 * 실제 API와 연동하여 인증 처리를 수행하고 스토어 데이터를 갱신합니다.
 */
export default function SignInForm() {
  const [accountId, setAccountId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthStore();
  const dialog = useDialogStore();

  const documentStore = useDocumentStore();
  const chatStore = useChatStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountId.trim() || !password.trim()) return;

    try {
      setIsLoading(true);

      // 1. 로그인 API 호출 (response는 LoginResponse 타입으로 자동 추론됨)
      const loginResponse = await loginAPI({
        account_id: accountId,
        password: password,
      });

      // 2. 백엔드 데이터(Snake_case) -> 프론트엔드 타입(CamelCase) 변환
      // getMyInfoAPI에서 employeeId 등을 포함하여 매핑해줌
      const fullUserInfo = await getMyInfoAPI(loginResponse.access_token);

      // 3. AuthStore에 변환된 유저 정보 및 토큰 저장
      login(
        fullUserInfo,
        loginResponse.access_token,
        loginResponse.refresh_token
      );
      // 4. 전역 스토어 데이터 초기화 및 갱신
      chatStore.resetAll();

      if (fullUserInfo.departmentId) {
        documentStore.setContext(
          fullUserInfo.departmentId,
          fullUserInfo.projectId || 0
        );
      } else {
        useDocumentStore.setState({ documents: [], selectedDocument: null });
      }

      // 5. 메인 페이지 이동
      navigate("/");
    } catch (error) {
      console.error("Login Error:", error);
      let message = "로그인에 실패했습니다.";
      if (error instanceof Error) {
        message = error.message;
      }

      dialog.alert({
        title: "로그인 실패",
        message: message,
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-6 mt-4" onSubmit={handleLogin}>
      <div className="space-y-4">
        <InputField
          label="아이디"
          id="signin-id"
          placeholder="아이디를 입력하세요"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          autoComplete="username"
        />

        <PasswordInput
          label="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          autoComplete="current-password"
        />
      </div>

      <div className="pt-2">
        <PrimaryButton
          type="submit"
          disabled={isLoading || !accountId || !password}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={20} /> 로그인 중...
            </span>
          ) : (
            "로그인"
          )}
        </PrimaryButton>
      </div>
    </form>
  );
}
