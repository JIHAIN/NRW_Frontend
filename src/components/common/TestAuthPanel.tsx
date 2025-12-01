import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSystemStore } from "@/store/systemStore";
import { FlaskConical, X, GripHorizontal, Loader2 } from "lucide-react";
import type { User, UserRole } from "@/types/UserType";

// ----------------------------------------------------------------------
// 1. 내부 전용 Select 컴포넌트
// ----------------------------------------------------------------------
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
      className="flex-1 rounded border border-blue-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer bg-white disabled:cursor-not-allowed text-black"
    >
      {children}
    </select>
  </label>
);

// ----------------------------------------------------------------------
// 2. 메인 컴포넌트
// ----------------------------------------------------------------------
export function TestAuthPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Store 구독 (logout 추가)
  const { user, login, logout } = useAuthStore();
  const { departments, projects, isLoading } = useSystemStore();

  // ---------------------------------------------------------
  // [핵심] UI 상태 관리
  // "NONE"은 로그아웃 상태를 의미함
  // ---------------------------------------------------------
  const [selectedRole, setSelectedRole] = useState<UserRole | "NONE">("USER");
  const [selectedDeptId, setSelectedDeptId] = useState<number>(0);
  const [selectedProjId, setSelectedProjId] = useState<number>(0);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // 1. 초기화
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setPosition({ x: window.innerWidth - 240, y: window.innerHeight - 200 });
    }
  }, []);

  // 2. 현재 유저 상태와 UI 동기화 (마운트 시 or 외부 변경 시)
  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
      setSelectedDeptId(user.departmentId);
      setSelectedProjId(user.projectId || 0);
    } else {
      // 유저가 없으면 NONE으로 설정
      setSelectedRole("NONE");
      setSelectedDeptId(0);
      setSelectedProjId(0);
    }
  }, [user]);

  // ---------------------------------------------------------
  // 3. 로그인 실행 함수
  // ---------------------------------------------------------
  const performLogin = (role: UserRole, deptId: number, projId: number) => {
    const targetDept = departments.find((d) => d.id === deptId);
    const deptName = targetDept ? targetDept.dept_name : "본사";

    const mockUser: User = {
      id: 1,
      accountId: "test_admin",
      userName: `[Test] ${role} (${deptName})`,
      role: role,
      departmentId: deptId,
      projectId: projId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    login(mockUser);
  };

  // ---------------------------------------------------------
  // 4. 자동 로그인 (최초 1회)
  // ---------------------------------------------------------
  const hasInit = useRef(false);

  useEffect(() => {
    if (isLoading || departments.length === 0 || hasInit.current) return;

    // 초기값: 슈퍼 관리자
    const initRole: UserRole = "SUPER_ADMIN";
    const initDept = 0;
    const initProj = 0;

    // UI 업데이트 & 로그인
    setSelectedRole(initRole);
    setSelectedDeptId(initDept);
    setSelectedProjId(initProj);
    performLogin(initRole, initDept, initProj);

    hasInit.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, departments]);

  // ---------------------------------------------------------
  // 5. 핸들러
  // ---------------------------------------------------------
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole | "NONE";

    // ✨ "로그인 안함" 선택 시 로그아웃 처리
    if (newRole === "NONE") {
      setSelectedRole("NONE");
      setSelectedDeptId(0);
      setSelectedProjId(0);
      logout(); // 로그아웃 액션
      return;
    }

    // 그 외 권한 변경 로직
    let newDept = selectedDeptId;
    if (newRole === "SUPER_ADMIN") {
      newDept = 0;
    } else if (newDept === 0 && departments.length > 0) {
      newDept = departments[0].id;
    }
    const newProj = 0;

    setSelectedRole(newRole);
    setSelectedDeptId(newDept);
    setSelectedProjId(newProj);

    performLogin(newRole, newDept, newProj);
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDept = Number(e.target.value);
    const newProj = 0;

    setSelectedDeptId(newDept);
    setSelectedProjId(newProj);

    if (selectedRole !== "NONE") {
      performLogin(selectedRole, newDept, newProj);
    }
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProj = Number(e.target.value);
    setSelectedProjId(newProj);

    if (selectedRole !== "NONE") {
      performLogin(selectedRole, selectedDeptId, newProj);
    }
  };

  // ---------------------------------------------------------
  // 6. 드래그 로직
  // ---------------------------------------------------------
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

  const filteredProjects = useMemo(() => {
    if (!selectedDeptId) return [];
    return projects.filter((p) => p.departmentId === selectedDeptId);
  }, [projects, selectedDeptId]);

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
              {/* Role 선택 */}
              <TestSelect
                label="Role"
                value={selectedRole}
                onChange={handleRoleChange}
              >
                <option value="SUPER_ADMIN">총괄 관리자</option>
                <option value="MANAGER">부서 관리자</option>
                <option value="USER">일반 사용자</option>
                {/* ✨ 로그인 안함 옵션 추가 */}
                <option value="NONE" className="text-red-500 font-bold">
                  로그인 안함
                </option>
              </TestSelect>

              {/* Dept 선택 */}
              <TestSelect
                label="Dept"
                value={selectedDeptId}
                onChange={handleDeptChange}
                // ✨ NONE일 때도 비활성화
                disabled={
                  selectedRole === "SUPER_ADMIN" || selectedRole === "NONE"
                }
              >
                <option value={0}>전체 / 선택 안함</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.dept_name}
                  </option>
                ))}
              </TestSelect>

              {/* Project 선택 */}
              <TestSelect
                label="Proj"
                value={selectedProjId}
                onChange={handleProjectChange}
                disabled={selectedRole !== "USER" || !selectedDeptId}
              >
                <option value={0}>선택 안함</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </TestSelect>

              {/* 상태 확인용 텍스트 */}
              <div className="mt-2 p-2 bg-blue-100 rounded text-[10px] text-blue-800 font-mono">
                User: {user ? user.userName : "Guest (비로그인)"} <br />
                Dept: {selectedDeptId} | Proj: {selectedProjId}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
