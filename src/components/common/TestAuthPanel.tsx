import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSystemStore } from "@/store/systemStore";
import { useChatStore } from "@/store/chatStore";
import { useDocumentStore } from "@/store/documentStore";
import { loginAPI } from "@/services/auth.service"; // 실제 로그인 API
import {
  FlaskConical,
  X,
  GripHorizontal,
  Loader2,
  PowerOff,
} from "lucide-react";

// 테스트용 계정
const TEST_ACCOUNTS: Record<number, { account_id: string; password: string }> =
  {
    1: { account_id: "super_admin", password: "2team" },
    2: { account_id: "manager_dt", password: "2team" },
    3: { account_id: "user_dt", password: "2team" },
  };

interface TestSelectProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

/**
 * 패널 내부 셀렉트 컴포넌트
 */
const TestSelect = ({
  label,
  value,
  onChange,
  children,
  disabled,
}: TestSelectProps) => (
  <label className={`flex items-center gap-2 ${disabled ? "opacity-50" : ""}`}>
    <span className="text-xs font-bold text-blue-900 w-10">{label}:</span>
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="flex-1 rounded border border-blue-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer bg-white disabled:cursor-not-allowed text-black"
    >
      {children}
    </select>
  </label>
);

/**
 * 개발용 사용자 전환 패널
 * - 미리 설정된 계정 정보로 '실제 로그인'을 수행합니다.
 */
export function TestAuthPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Real Mode: 패널이 로그인 상태에 개입하지 않는 모드
  const [isRealMode, setIsRealMode] = useState(false);

  // Stores
  const { user, login, logout } = useAuthStore();
  const { fetchSystemData } = useSystemStore();

  // 상태 관리
  const [selectedUserId, setSelectedUserId] = useState<string>("REAL");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setPosition({ x: window.innerWidth - 240, y: window.innerHeight - 200 });
    }
  }, []);

  // UI 동기화
  useEffect(() => {
    if (isRealMode) {
      setSelectedUserId("REAL");
      return;
    }
    if (user) {
      setSelectedUserId(String(user.id));
    } else {
      setSelectedUserId("0");
    }
  }, [user, isRealMode]);

  /**
   * 사용자 전환 핸들러
   * 1. Real Mode 처리
   * 2. 로그아웃 처리
   * 3. 자동 로그인 (API 호출) 처리
   */
  const handleUserSwitch = async (targetIdStr: string) => {
    // 1. Real Mode 진입
    if (targetIdStr === "REAL") {
      setIsRealMode(true);
      return;
    }

    if (isRealMode) setIsRealMode(false);

    // 2. 로그아웃
    if (targetIdStr === "0") {
      useChatStore.getState().resetAll();
      useDocumentStore.setState({ documents: [], selectedDocument: null });
      logout();
      return;
    }

    try {
      setIsProcessing(true);
      const targetId = Number(targetIdStr);

      // 해당 ID에 매핑된 계정 정보 가져오기
      const credentials = TEST_ACCOUNTS[targetId];
      if (!credentials) {
        alert(
          `ID ${targetId}에 대한 계정 정보가 설정되지 않았습니다.\nTestAuthPanel.tsx 상단의 TEST_ACCOUNTS를 확인해주세요.`
        );
        return;
      }

      // 데이터 초기화
      useChatStore.getState().resetAll();
      useDocumentStore.setState({
        documents: [],
        selectedDocument: null,
        taskQueue: [],
      });

      // 3. [핵심] 실제 로그인 API 호출
      // 여기서 진짜 Access Token을 받아옵니다.
      const response = await loginAPI({
        account_id: credentials.account_id,
        password: credentials.password,
      });

      // 4. 데이터 매핑 (Snake_case -> CamelCase)
      // SignInForm.tsx의 로직과 동일하게 맞춤
      const rawUser = response.user;
      const mappedUser = {
        id: rawUser.id,
        accountId: rawUser.account_id,
        userName: rawUser.user_name,
        role: rawUser.role,
        departmentId: rawUser.dept_id || 0,
        projectId: rawUser.project_id || 0,
        profileImagePath: rawUser.profile_image_path || "",
        isActive: true,
        createdAt: "",
        updatedAt: "",
      };

      // 5. 로그인 처리 (스토어에 유효한 토큰 저장)
      login(mappedUser, response.access_token, response.refresh_token);

      // 6. 시스템 데이터 최신화
      await fetchSystemData();

      // 7. 문서 컨텍스트 설정
      if (mappedUser.departmentId) {
        useDocumentStore
          .getState()
          .setContext(mappedUser.departmentId, mappedUser.projectId || 0);
      } else {
        useDocumentStore.setState({ documents: [], selectedDocument: null });
      }

      console.log(
        `[TestAuthPanel] Logged in as: ${mappedUser.userName} (ID: ${mappedUser.id})`
      );
    } catch (error: unknown) {
      console.error("사용자 전환 실패:", error);
      let errorMessage = "알 수 없는 오류";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(
        `로그인 실패: ${errorMessage}\n아이디와 비밀번호가 정확한지 확인해주세요.`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedUserId(val);
    handleUserSwitch(val);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDragging.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const moveDistance = Math.hypot(
        moveEvent.clientX - dragStartPos.current.x,
        moveEvent.clientY - dragStartPos.current.y
      );
      if (moveDistance > 5) isDragging.current = true;
      setPosition({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  if (!isMounted) return null;

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-9999 flex flex-col items-end select-none"
    >
      {!isOpen && (
        <button
          onMouseDown={handleMouseDown}
          onClick={() => !isDragging.current && setIsOpen(true)}
          className={`rounded-full p-3 text-white shadow-lg transition-transform hover:scale-110 cursor-move active:scale-95 ${
            isRealMode
              ? "bg-gray-600 hover:bg-gray-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          title={
            isRealMode ? "Real Mode (패널 비활성)" : "Dev Mode (패널 활성)"
          }
        >
          {isRealMode ? <PowerOff size={24} /> : <FlaskConical size={24} />}
        </button>
      )}

      {isOpen && (
        <div
          className={`flex flex-col gap-2 rounded-xl border-2 p-4 shadow-xl animate-in fade-in zoom-in-95 duration-200 min-w-64 ${
            isRealMode
              ? "border-gray-400 bg-gray-100"
              : "border-blue-500 bg-blue-50"
          }`}
        >
          <div
            className={`flex items-center justify-between border-b pb-2 mb-1 cursor-move ${
              isRealMode ? "border-gray-300" : "border-blue-200"
            }`}
            onMouseDown={handleMouseDown}
          >
            <h4
              className={`text-sm font-bold flex items-center gap-2 pointer-events-none ${
                isRealMode ? "text-gray-600" : "text-blue-700"
              }`}
            >
              <GripHorizontal
                size={16}
                className={isRealMode ? "text-gray-400" : "text-blue-400"}
              />
              {isRealMode ? "Real Mode (Off)" : "Dev User Switcher"}
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {isProcessing ? (
            <div className="flex justify-center items-center py-4 text-blue-500">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="flex flex-col gap-2"
            >
              <TestSelect
                label="User"
                value={selectedUserId}
                onChange={handleChange}
              >
                <option value="REAL">패널 끄기 (Real Mode)</option>
                <option value="0">로그인 안 함 (Guest)</option>
                <optgroup label="Real DB Users">
                  <option value="1">총괄 관리자 (ID: 1)</option>
                  <option value="2">부서 관리자 (ID: 2)</option>
                  <option value="3">일반 사용자 (ID: 3)</option>
                </optgroup>
              </TestSelect>

              <div
                className={`mt-2 p-2 rounded text-[10px] font-mono border ${
                  isRealMode
                    ? "bg-gray-200 text-gray-700 border-gray-300"
                    : "bg-blue-100 text-blue-800 border-blue-200"
                }`}
              >
                <strong>Current State:</strong> <br />
                ID: {user?.id || "-"} <br />
                Name: {user ? user.userName : "Guest"} <br />
                Role: {user?.role || "-"} <br />
                {isRealMode && (
                  <span className="font-bold text-green-700 mt-1 block">
                    [Real Mode Active]
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
