import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSystemStore } from "@/store/systemStore"; // ✨ 시스템 스토어 임포트
import { FlaskConical, X, GripHorizontal, Loader2 } from "lucide-react";

// 내부용 Select 컴포넌트
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
  // 1. 패널 열림/닫힘 상태
  const [isOpen, setIsOpen] = useState(false);

  // 2. Store 구독
  const { role, department, project, setAuth } = useAuthStore();
  const { departments, projects, isLoading, fetchSystemData } =
    useSystemStore(); // ✨ 시스템 데이터 가져오기

  // 3. 위치 상태 관리
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  // 4. 드래그 관련 Refs
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // ✨ 초기화 Effect: 위치 설정 및 데이터 로드
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPosition({
        x: window.innerWidth - 80,
        y: window.innerHeight - 80,
      });
      setIsInitialized(true);
    }
    // 컴포넌트 마운트 시 DB(Mock) 데이터 가져오기
    fetchSystemData();
  }, [fetchSystemData]);

  // ✨ 드래그 핸들러 로직
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

  // 클릭 핸들러 (드래그 아닐 때만 토글)
  const togglePanel = () => {
    if (!isDragging.current) {
      setIsOpen(!isOpen);
    }
  };

  // ✨ 옵션 데이터 가공 (Store 데이터 사용)
  const departmentOptions = departments.map((d) => ({
    value: d.name,
    label: d.name,
    id: d.id,
  }));

  // 선택된 부서에 맞는 프로젝트 필터링
  const currentDeptId = departments.find((d) => d.name === department)?.id;

  const projectOptions = projects
    .filter((p) => p.dept_id === currentDeptId)
    .map((p) => ({ value: p.name, label: p.name }));

  // 핸들러들
  const handleRoleChange = (newRole: string) =>
    setAuth(newRole, department, project);

  const handleDeptChange = (newDept: string) => {
    const newDeptId = departments.find((d) => d.name === newDept)?.id;
    // 해당 부서의 첫 번째 프로젝트로 자동 선택
    const firstProject =
      projects.find((p) => p.dept_id === newDeptId)?.name || "";

    setAuth(role, newDept, firstProject);
  };

  const handleProjectChange = (newProject: string) =>
    setAuth(role, department, newProject);

  // 초기화 전 렌더링 방지
  if (!isInitialized) return null;

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50 flex flex-col items-end select-none"
    >
      {/* 1. 닫혀있을 때 (아이콘 버튼) */}
      {!isOpen && (
        <button
          onMouseDown={handleMouseDown}
          onClick={togglePanel}
          className="rounded-full bg-blue-600 p-3 text-white shadow-lg transition-transform hover:scale-110 hover:bg-blue-700 cursor-move active:scale-95"
          title="드래그하여 이동 / 클릭하여 열기"
        >
          <FlaskConical size={24} />
        </button>
      )}

      {/* 2. 열려있을 때 (패널) */}
      {isOpen && (
        <div className="flex flex-col gap-2 rounded-xl border-2 border-blue-500 bg-blue-50 p-4 shadow-xl animate-in fade-in zoom-in-95 duration-200 min-w-[220px]">
          {/* 패널 헤더 */}
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

          {/* 컨텐츠 영역 */}
          {isLoading ? (
            // ✨ 로딩 중일 때 스피너 표시
            <div className="flex justify-center items-center py-4 text-blue-500">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : (
            // ✨ 데이터 로드 완료 시 컨트롤 표시
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
