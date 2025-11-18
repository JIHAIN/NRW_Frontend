import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSystemStore } from "@/store/systemStore";
import { FlaskConical, X, GripHorizontal, Loader2 } from "lucide-react";

// ✨ 1. any 제거: Props 인터페이스 정의
interface TestSelectProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; // 이벤트 타입 명시
  children: React.ReactNode; // any -> ReactNode
}

const TestSelect = ({ label, value, onChange, children }: TestSelectProps) => (
  <label className="flex items-center gap-2">
    <span className="text-xs font-bold text-blue-900">{label}:</span>
    <select
      value={value}
      onChange={onChange} // ✨ 타입 일치
      className="rounded border border-blue-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer bg-white"
    >
      {children}
    </select>
  </label>
);

export function TestAuthPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { role, department, project, setAuth } = useAuthStore();
  const { departments, projects, isLoading, fetchSystemData } =
    useSystemStore();

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPosition({
        x: window.innerWidth - 80,
        y: window.innerHeight - 80,
      });
      setIsInitialized(true);
    }
    fetchSystemData();
  }, [fetchSystemData]);

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

  // ---------------------------------------------------------
  // ✨ 타입 안전한 옵션 생성
  // ---------------------------------------------------------
  const departmentOptions = departments.map((d) => ({
    value: d.name,
    label: d.name,
    id: d.id,
  }));

  // 현재 선택된 부서의 ID 찾기
  const currentDeptId = departments.find((d) => d.name === department)?.id;

  const projectOptions = projects
    // ✨ [수정] dept_id -> departmentId (타입 오류 해결)
    .filter((p) => p.departmentId === currentDeptId)
    .map((p) => ({ value: p.name, label: p.name }));

  // ---------------------------------------------------------
  // ✨ 이벤트 핸들러 (ChangeEvent 타입 적용)
  // ---------------------------------------------------------
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAuth(e.target.value, department, project);
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDeptName = e.target.value;
    const newDeptId = departments.find((d) => d.name === newDeptName)?.id;

    // ✨ [수정] dept_id -> departmentId
    const firstProject =
      projects.find((p) => p.departmentId === newDeptId)?.name || "";

    setAuth(role, newDeptName, firstProject);
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAuth(role, department, e.target.value);
  };

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
        <div className="flex flex-col gap-2 rounded-xl border-2 border-blue-500 bg-blue-50 p-4 shadow-xl animate-in fade-in zoom-in-95 duration-200 min-w-[220px]">
          <div
            className="flex items-center justify-between border-b border-blue-200 pb-2 mb-1 cursor-move"
            onMouseDown={handleMouseDown}
          >
            <h4 className="text-sm font-bold text-blue-700 flex items-center gap-2 pointer-events-none">
              <GripHorizontal size={16} className="text-blue-400" />
              권한 제어 (DB)
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
              {/* ✨ 핸들러 전달 시 함수 참조만 전달 (e 객체 자동 전달됨) */}
              <TestSelect label="Role" value={role} onChange={handleRoleChange}>
                <option value="user">일반 사용자</option>
                <option value="manager">부서장 (Manager)</option>
                <option value="super_admin">총괄 관리자</option>
              </TestSelect>

              <TestSelect
                label="Dept"
                value={department}
                onChange={handleDeptChange}
              >
                <option value="">부서 선택</option>
                {departmentOptions.map((opt) => (
                  <option key={opt.id} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </TestSelect>

              <TestSelect
                label="Proj"
                value={project}
                onChange={handleProjectChange}
              >
                {projectOptions.length === 0 && <option value="">-</option>}
                {projectOptions.map((opt, idx) => (
                  <option key={idx} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </TestSelect>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
