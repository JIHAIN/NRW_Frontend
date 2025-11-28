import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useAuthStore } from "@/store/authStore";
import { useSystemStore } from "@/store/systemStore";
import { FlaskConical, X, GripHorizontal, Loader2 } from "lucide-react";
import type { User, UserRole } from "@/types/UserType";

// ✨ Select 컴포넌트 (재사용)
interface TestSelectProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

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
      className="flex-1 rounded border border-blue-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer bg-white disabled:cursor-not-allowed"
    >
      {children}
    </select>
  </label>
);

export function TestAuthPanel() {
  const [isOpen, setIsOpen] = useState(false);

  // ✨ authStore에서 user 정보와 로그인 함수 가져오기
  const { user, login } = useAuthStore();
  // ✨ [수정 1] fetchSystemData 제거 (사용하지 않음)
  const { departments, projects, isLoading } = useSystemStore();

  // 드래그 관련 상태
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // 내부 상태로 선택값 관리
  const [localDeptId, setLocalDeptId] = useState<number>(0);

  // user 정보가 바뀌면 로컬 상태도 동기화
  useEffect(() => {
    if (user?.departmentId) {
      setLocalDeptId(user.departmentId);
    }
  }, [user?.departmentId]);

  // ---------------------------------------------------------
  // 🏗️ Mock User 생성 및 로그인 로직
  // ---------------------------------------------------------
  const createAndLoginUser = useCallback(
    (newRole: UserRole, newDeptId: number, newProjId: number) => {
      const deptName =
        departments.find((d) => d.id === newDeptId)?.dept_name || "본사";

      // 가상의 User 객체 생성
      const mockUser: User = {
        id: 1,
        accountId: "test_admin",
        userName: `[Test] ${newRole} (${deptName})`,
        role: newRole,
        departmentId: newDeptId || 1,
        projectId: newProjId || 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("🧪 Test Login:", mockUser);
      login(mockUser);
    },
    [departments, login]
  );

  // ---------------------------------------------------------
  // 초기화 및 데이터 로드
  // ---------------------------------------------------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPosition({ x: window.innerWidth - 240, y: window.innerHeight - 200 });
      setIsInitialized(true);
    }
  }, []);

  const hasAutoLoggedIn = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (user || departments.length === 0 || hasAutoLoggedIn.current) return;

    // ✨ [수정 2] initialDeptId 변수 삭제 (바로 값 사용)
    // 초기 로그인 (총괄 관리자는 부서 0)
    createAndLoginUser("SUPER_ADMIN", 0, 0);
    setLocalDeptId(0);
    hasAutoLoggedIn.current = true;
  }, [isLoading, user, departments, createAndLoginUser]);

  // ---------------------------------------------------------
  // ✋ 이벤트 핸들러
  // ---------------------------------------------------------

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    const nextDeptId =
      newRole === "SUPER_ADMIN" ? 0 : localDeptId || departments[0]?.id || 0;

    setLocalDeptId(nextDeptId);
    createAndLoginUser(newRole, nextDeptId, 0);
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDeptId = Number(e.target.value);
    setLocalDeptId(newDeptId);
    createAndLoginUser(user?.role || "USER", newDeptId, 0);
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjId = Number(e.target.value);
    createAndLoginUser(user?.role || "USER", localDeptId, newProjId);
  };

  // ---------------------------------------------------------
  // 🎨 드래그 앤 드롭 로직
  // ---------------------------------------------------------
  const handleMouseDown = (e: React.MouseEvent) => {
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

  const togglePanel = () => {
    if (!isDragging.current) setIsOpen(!isOpen);
  };

  const filteredProjects = useMemo(() => {
    if (!localDeptId) return [];
    return projects.filter((p) => p.departmentId === localDeptId);
  }, [projects, localDeptId]);

  if (!isInitialized) return null;

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50 flex flex-col items-end select-none"
    >
      {!isOpen && (
        <button
          onMouseDown={handleMouseDown}
          onClick={togglePanel}
          className="rounded-full bg-blue-600 p-3 text-white shadow-lg transition-transform hover:scale-110 hover:bg-blue-700 cursor-move active:scale-95"
        >
          <FlaskConical size={24} />
        </button>
      )}

      {isOpen && (
        <div className="flex flex-col gap-2 rounded-xl border-2 border-blue-500 bg-blue-50 p-4 shadow-xl animate-in fade-in zoom-in-95 duration-200 min-w-60">
          <div
            className="flex items-center justify-between border-b border-blue-200 pb-2 mb-1 cursor-move"
            onMouseDown={handleMouseDown}
          >
            <h4 className="text-sm font-bold text-blue-700 flex items-center gap-2 pointer-events-none">
              <GripHorizontal size={16} className="text-blue-400" />
              권한 시뮬레이션
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-4 text-blue-500">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="flex flex-col gap-2"
            >
              {/* 1. Role 선택 */}
              <TestSelect
                label="Role"
                value={user?.role || "USER"}
                onChange={handleRoleChange}
              >
                <option value="SUPER_ADMIN">총괄 관리자</option>
                <option value="MANAGER">부서 관리자</option>
                <option value="USER">일반 사용자</option>
              </TestSelect>

              {/* 2. Department 선택 */}
              <TestSelect
                label="Dept"
                value={localDeptId}
                onChange={handleDeptChange}
                disabled={user?.role === "SUPER_ADMIN"}
              >
                <option value={0}>전체 / 선택 안함</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.dept_name}
                  </option>
                ))}
              </TestSelect>

              {/* 3. Project 선택 */}
              <TestSelect
                label="Proj"
                value={user?.projectId || 0}
                onChange={handleProjectChange}
                disabled={user?.role !== "USER" || !localDeptId}
              >
                <option value={0}>선택 안함</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </TestSelect>

              <div className="mt-2 p-2 bg-blue-100 rounded text-[10px] text-blue-800 font-mono">
                ID: {user?.id} <br />
                Name: {user?.userName} <br />
                DeptID: {localDeptId} <br />
                ProjID: {user?.projectId}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
