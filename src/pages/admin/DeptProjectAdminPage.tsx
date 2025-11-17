// src/pages/admin/DeptProjectAdminPage.tsx

import { useState, type FC } from "react";
// 💡 통합 더미 데이터 사용으로 변경
import { DUMMY_DEPARTMENTS, DUMMY_PROJECTS } from "../../types/dummy_data";
import DepartmentManager from "./components/DepartmentManager";
import ProjectManager from "./components/ProjectManager";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import type { Department, Project } from "@/types/UserType";
import { X } from "lucide-react";

// --------------------------------------------------------------------------
// 💡 부서 삭제를 위한 간단한 확인 모달 (ManagePage 내부에 정의)
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
// 💡 메인 컴포넌트: ManagePage
// --------------------------------------------------------------------------

export const DeptProjectAdminPage: FC = () => {
  // 📚 부서 및 프로젝트 데이터 상태 관리 (더미 데이터 사용)
  const [departments, setDepartments] =
    useState<Department[]>(DUMMY_DEPARTMENTS);
  const [projects, setProjects] = useState<Project[]>(DUMMY_PROJECTS);

  // 💡 선택된 부서 ID 상태 (필터링 기준)
  // 초기값은 '전체'를 의미하는 null 또는 0으로 설정합니다.
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);

  // 🗑️ 프로젝트 삭제 모달 상태
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // 🗑️ 부서 삭제 모달 상태
  const [isDeptModalOpen, setIsDeptModalOpen] = useState<boolean>(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

  // -------------------------
  // 💡 데이터 CRUD 함수
  // -------------------------
  const handleAddDepartment = (name: string) => {
    const newId = Math.max(...departments.map((d) => d.id)) + 1;
    setDepartments([...departments, { id: newId, name }]);
  };

  const handleDeleteDepartment = () => {
    if (!deptToDelete) return;

    // 1. 부서 삭제
    setDepartments(departments.filter((d) => d.id !== deptToDelete.id));

    // 2. 해당 부서의 프로젝트도 삭제
    const remainingProjects = projects.filter(
      (p) => p.departmentId !== deptToDelete.id
    );
    setProjects(remainingProjects);

    // 3. 모달 닫기 및 필터 초기화
    setIsDeptModalOpen(false);
    setDeptToDelete(null);
    setSelectedDepartmentId(null);
  };

  const handleAddProject = (name: string, departmentId: number) => {
    const newId = Math.max(...projects.map((p) => p.id)) + 1;
    setProjects([
      ...projects,
      {
        id: newId,
        name,
        departmentId,
        creationDate: new Date().toISOString().split("T")[0],
      },
    ]);
  };

  const handleConfirmProjectDelete = (keepDocuments: boolean) => {
    if (!projectToDelete) return;

    // 프로젝트 삭제
    const projectId = projectToDelete.id;
    setProjects(projects.filter((p) => p.id !== projectId));

    if (!keepDocuments) {
      console.log(
        `[문서 삭제] 프로젝트 ID ${projectId}의 모든 문서를 삭제합니다.`
      );
      // 실제 API 호출 로직: deleteDocumentsByProjectId(projectId);
    } else {
      console.log(`[문서 보관] 프로젝트 ID ${projectId}의 문서는 유지합니다.`);
      // 실제 API 호출 로직: updateDocumentsProjectIdToNull(projectId);
    }

    setIsProjectModalOpen(false);
    setProjectToDelete(null);
  };

  // -------------------------
  // 💡 부서 클릭/선택 핸들러
  // -------------------------
  const handleSelectDepartment = (deptId: number | null) => {
    setSelectedDepartmentId(deptId);
  };

  // -------------------------
  // 💡 렌더링
  // -------------------------
  return (
    <div className="flex flex-col gap-4  page-layout h-full w-full">
      <h1 className=" page-title">부서 및 프로젝트 관리</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full w-full">
        {/* 1. 부서 관리 영역 (왼쪽) */}
        <DepartmentManager
          departments={departments}
          onAdd={handleAddDepartment}
          // 삭제 버튼 클릭 시 모달 상태만 업데이트
          onDeleteClick={(dept) => {
            setDeptToDelete(dept);
            setIsDeptModalOpen(true);
          }}
          // 💡 부서 목록 클릭 시 필터링 ID 업데이트
          onSelectDept={handleSelectDepartment}
          selectedDeptId={selectedDepartmentId}
        />

        {/* 2. 프로젝트 관리 영역 (오른쪽) */}
        <ProjectManager
          projects={projects}
          departments={departments}
          onAdd={handleAddProject}
          // 삭제 버튼 클릭 시 프로젝트 모달 상태 업데이트
          onDeleteClick={(proj) => {
            setProjectToDelete(proj);
            setIsProjectModalOpen(true);
          }}
          // 💡 필터링 상태와 핸들러 전달
          selectedDeptId={selectedDepartmentId}
          onSelectDept={handleSelectDepartment}
        />
      </div>

      {/* 🗑️ 프로젝트 삭제 확인 모달 */}
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

      {/* 🗑️ 부서 삭제 확인 모달 (SimpleConfirmModal 사용) */}
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
