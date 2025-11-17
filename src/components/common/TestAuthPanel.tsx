import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { DUMMY_DEPARTMENTS, DUMMY_PROJECTS } from "@/types/dummy_data";
import { FlaskConical, X, GripHorizontal } from "lucide-react"; // ✨ Grip 아이콘 추가

const TestSelect = ({ label, value, onChange, children }: any) => (
  <label className="flex items-center gap-2">
    <span className="text-xs font-bold text-blue-900">{label}:</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-blue-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer bg-white"
    >
      {children}
    </select>
  </label>
);

export function TestAuthPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { role, department, project, setAuth } = useAuthStore();

  // ✨ 1. 위치 상태 관리 (초기값: 우측 하단 여백)
  // (처음 렌더링 시에는 window 객체가 없을 수 있으므로 안전하게 처리)
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  // ✨ 2. 드래그 여부 판별을 위한 Ref (드래그 중 클릭 이벤트 방지용)
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // 초기 위치 설정 (우측 하단)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPosition({
        x: window.innerWidth - 80, // 오른쪽에서 80px
        y: window.innerHeight - 80, // 아래쪽에서 80px
      });
      setIsInitialized(true);
    }
  }, []);

  // ✨ 3. 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // 조금이라도 움직이면 드래그로 간주
      const moveDistance = Math.hypot(
        moveEvent.clientX - dragStartPos.current.x,
        moveEvent.clientY - dragStartPos.current.y
      );

      if (moveDistance > 5) {
        isDragging.current = true;
      }

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

  // ✨ 4. 클릭 핸들러 (드래그가 아닐 때만 열기/닫기)
  const togglePanel = () => {
    if (!isDragging.current) {
      setIsOpen(!isOpen);
    }
  };

  // 옵션 데이터 등 기존 로직
  const departmentOptions = DUMMY_DEPARTMENTS.map((d) => ({
    value: d.name,
    label: d.name,
  }));
  const projectOptions = DUMMY_PROJECTS.filter(
    (p) =>
      p.departmentId ===
      DUMMY_DEPARTMENTS.find((d) => d.name === department)?.id
  ).map((p) => ({ value: p.name, label: p.name }));

  const handleRoleChange = (newRole: string) =>
    setAuth(newRole, department, project);
  const handleDeptChange = (newDept: string) => {
    const newDeptId = DUMMY_DEPARTMENTS.find((d) => d.name === newDept)?.id;
    const firstProject =
      DUMMY_PROJECTS.find((p) => p.departmentId === newDeptId)?.name || "";
    setAuth(role, newDept, firstProject);
  };
  const handleProjectChange = (newProject: string) =>
    setAuth(role, department, newProject);

  // 아직 초기화 안 됐으면 렌더링 안 함 (깜빡임 방지)
  if (!isInitialized) return null;

  return (
    <div
      // ✨ 5. 스타일 적용: fixed 위치를 state 값으로 제어
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50 flex flex-col items-end select-none" // select-none: 텍스트 선택 방지
    >
      {/* 닫혀있을 때 (아이콘) */}
      {!isOpen && (
        <button
          onMouseDown={handleMouseDown}
          onClick={togglePanel}
          // ✨ cursor-move 추가
          className="rounded-full bg-blue-600 p-3 text-white shadow-lg transition-transform hover:scale-110 hover:bg-blue-700 cursor-move active:scale-95"
          title="드래그하여 이동 / 클릭하여 열기"
        >
          <FlaskConical size={24} />
        </button>
      )}

      {/* 열려있을 때 (패널) */}
      {isOpen && (
        <div className="flex flex-col gap-2 rounded-xl border-2 border-blue-500 bg-blue-50 p-4 shadow-xl animate-in fade-in zoom-in-95 duration-200 min-w-[200px]">
          {/* 패널 헤더 (드래그 핸들 + 닫기) */}
          <div
            className="flex items-center justify-between border-b border-blue-200 pb-2 mb-1 cursor-move"
            onMouseDown={handleMouseDown} // ✨ 헤더를 잡고 드래그 가능하게 설정
          >
            <h4 className="text-sm font-bold text-blue-700 flex items-center gap-2 pointer-events-none">
              <GripHorizontal size={16} className="text-blue-400" />
              개발 권한 제어
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              // ✨ 마우스 다운 이벤트 전파 막기 (닫기 버튼 누를 때 드래그 시작 방지)
              onMouseDown={(e) => e.stopPropagation()}
              className="text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* 컨텐츠 영역 (드래그 방지 - 마우스 이벤트 전파 중단) */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="flex flex-col gap-2"
          >
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
              {departmentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
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
              {projectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </TestSelect>
          </div>
        </div>
      )}
    </div>
  );
}
