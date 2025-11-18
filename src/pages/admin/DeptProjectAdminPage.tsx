// src/pages/admin/DeptProjectAdminPage.tsx

import { useState, type FC, useEffect } from "react";
import DepartmentManager from "./components/DepartmentManager";
import ProjectManager from "./components/ProjectManager";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import type { Department, Project } from "@/types/UserType";
import { X } from "lucide-react";

// ✨ 시스템 스토어 임포트
import { useSystemStore } from "@/store/systemStore";

// --------------------------------------------------------------------------
// 💡 부서/프로젝트 삭제를 위한 간단한 확인 모달
// --------------------------------------------------------------------------
interface SimpleConfirmModalProps {
  name: string;
  type: "부서" | "프로젝트";
  onConfirm: () => void;
  onClose: () => void;
}

const SimpleConfirmModal: FC<SimpleConfirmModalProps> = ({
  name,
  type,
  onConfirm,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-80 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold mb-4 text-red-600">
          {type} 삭제 확인
        </h3>
        <p className="mb-6 text-sm text-gray-600">
          정말로 <span className="font-semibold text-red-600">"{name}"</span>{" "}
          {type}을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// 💡 메인 컴포넌트: DeptProjectAdminPage
// --------------------------------------------------------------------------

export const DeptProjectAdminPage: FC = () => {
  // ✨ 1. 시스템 스토어 구독
  const {
    departments,
    projects,
    fetchSystemData,
    addDepartment,
    deleteDepartment,
    addProject,
    deleteProject,
  } = useSystemStore();

  // ✨ 2. 초기 데이터 로드
  useEffect(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  // UI 상태 관리
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);

  // 프로젝트 삭제 모달 상태
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // 부서 삭제 모달 상태
  const [isDeptModalOpen, setIsDeptModalOpen] = useState<boolean>(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

  // -------------------------
  // 💡 핸들러 함수 (Store 액션 호출)
  // -------------------------

  // 1. 부서 추가
  const handleAddDepartment = (name: string) => {
    addDepartment(name);
  };

  // 2. 부서 삭제
  const handleDeleteDepartment = () => {
    if (!deptToDelete) return;

    deleteDepartment(deptToDelete.id);

    setIsDeptModalOpen(false);
    setDeptToDelete(null);

    // 현재 보고 있던 부서가 삭제되면 선택 해제
    if (selectedDepartmentId === deptToDelete.id) {
      setSelectedDepartmentId(null);
    }
  };

  // 3. 프로젝트 추가
  const handleAddProject = (name: string, departmentId: number) => {
    // ✨ 새로운 UserType에 맞춰 객체 생성
    const newProject: Project = {
      id: 0, // Store에서 ID 재할당됨
      departmentId: departmentId, // departmentId -> departmentId 확인!
      name: name,
      description: "",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addProject(newProject);
  };

  // 4. 프로젝트 삭제
  const handleConfirmProjectDelete = (keepDocuments: boolean) => {
    if (!projectToDelete) return;

    deleteProject(projectToDelete.id);

    if (!keepDocuments) {
      console.log(
        `[API 요청 필요] 프로젝트 ID ${projectToDelete.id} 관련 문서 삭제 로직 실행`
      );
    } else {
      console.log(`[정보] 프로젝트 문서는 보관됩니다.`);
    }

    setIsProjectModalOpen(false);
    setProjectToDelete(null);
  };

  // 부서 선택 핸들러
  const handleSelectDepartment = (deptId: number | null) => {
    setSelectedDepartmentId(deptId);
  };

  return (
    <div className="flex flex-col gap-4 page-layout h-full w-full">
      <h1 className="page-title">부서 및 프로젝트 관리</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full w-full">
        {/* 좌측: 부서 관리 */}
        <DepartmentManager
          departments={departments}
          onAdd={handleAddDepartment}
          onDeleteClick={(dept) => {
            setDeptToDelete(dept);
            setIsDeptModalOpen(true);
          }}
          onSelectDept={handleSelectDepartment}
          selectedDeptId={selectedDepartmentId}
        />

        {/* 우측: 프로젝트 관리 */}
        <ProjectManager
          projects={projects}
          departments={departments}
          onAdd={handleAddProject}
          onDeleteClick={(proj) => {
            setProjectToDelete(proj);
            setIsProjectModalOpen(true);
          }}
          selectedDeptId={selectedDepartmentId}
          onSelectDept={handleSelectDepartment}
        />
      </div>

      {/* 프로젝트 삭제 모달 */}
      {isProjectModalOpen && projectToDelete && (
        <DeleteConfirmationModal
          projectName={projectToDelete.name}
          onConfirm={handleConfirmProjectDelete}
          onCancel={() => {
            setIsProjectModalOpen(false);
            setProjectToDelete(null);
          }}
        />
      )}

      {/* 부서 삭제 모달 */}
      {isDeptModalOpen && deptToDelete && (
        <SimpleConfirmModal
          name={deptToDelete.name}
          type="부서"
          onConfirm={handleDeleteDepartment}
          onClose={() => {
            setIsDeptModalOpen(false);
            setDeptToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default DeptProjectAdminPage;
