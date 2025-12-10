import { useState, type FC, useEffect } from "react";
import DepartmentManager from "./components/DepartmentManager";
import ProjectManager from "./components/ProjectManager";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import type { Department, Project } from "@/types/UserType";
// [삭제] SimpleConfirmModal에서 쓰던 X 아이콘 제거

// 시스템 스토어 & 인증 스토어 임포트
import { useSystemStore } from "@/store/systemStore";
import { useAuthStore } from "@/store/authStore";
// [추가] 다이얼로그 스토어
import { useDialogStore } from "@/store/dialogStore";

// [삭제] SimpleConfirmModal 관련 코드 전체 제거 (GlobalDialog로 대체)

// --------------------------------------------------------------------------
// === 메인 컴포넌트: DeptProjectAdminPage
// --------------------------------------------------------------------------

export const DeptProjectAdminPage: FC = () => {
  // 시스템 스토어 구독
  const {
    departments,
    projects,
    isLoading,
    fetchSystemData,
    addDepartment,
    deleteDepartment,
    addProject,
    deleteProject,
  } = useSystemStore();

  const { user } = useAuthStore();
  const dialog = useDialogStore(); // [추가] 다이얼로그 훅

  const isManager = user?.role === "MANAGER";

  useEffect(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);

  // 프로젝트 삭제 모달 상태 (복잡한 로직이 있어 유지)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // [삭제] 부서 삭제 모달 관련 상태 변수 제거 (isDeptModalOpen, deptToDelete)

  // 권한에 따른 부서 선택 상태 초기화
  useEffect(() => {
    if (user?.role === "MANAGER") {
      setSelectedDepartmentId(user?.departmentId || null);
    }
  }, [user]);

  // -------------------------
  //  핸들러 함수 (Async 적용)
  // -------------------------

  // 1. 부서 추가
  const handleAddDepartment = async (name: string) => {
    if (isManager) return;
    try {
      await addDepartment(name);
      // [추가] 성공 알림
      dialog.alert({
        message: "부서가 성공적으로 추가되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
      dialog.alert({ message: "부서 추가 실패", variant: "error" });
    }
  };

  const handleDeleteDepartment = async (dept: Department) => {
    if (isManager) return;

    const confirmed = await dialog.confirm({
      title: "부서 삭제",
      message: `정말로 "${dept.dept_name}" 부서를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      variant: "error", // 빨간색 경고
    });

    if (confirmed) {
      try {
        await deleteDepartment(dept.id);

        if (selectedDepartmentId === dept.id) {
          setSelectedDepartmentId(null);
        }

        dialog.alert({
          message: "부서가 삭제되었습니다.",
          variant: "success",
        });
      } catch (error) {
        console.error(error);
        dialog.alert({
          message: "부서 삭제 중 오류가 발생했습니다.",
          variant: "error",
        });
      }
    }
  };

  // 3. 프로젝트 추가
  const handleAddProject = async (name: string, departmentId: number) => {
    if (isManager && departmentId !== user?.departmentId) {
      dialog.alert({
        message: "본인 부서의 프로젝트만 생성할 수 있습니다.",
        variant: "warning",
      });
      return;
    }

    const newProject: Project = {
      id: 0,
      departmentId: departmentId,
      name: name,
      description: "",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await addProject(newProject);
      dialog.alert({
        message: "프로젝트가 추가되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
      dialog.alert({ message: "프로젝트 추가 실패", variant: "error" });
    }
  };

  // 4. 프로젝트 삭제 (기존 로직 유지)
  const handleConfirmProjectDelete = async (keepDocuments: boolean) => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete.id);

      if (!keepDocuments) {
        console.log(
          `[API 요청 필요] 프로젝트 ID ${projectToDelete.id} 관련 문서 삭제 로직 실행`
        );
      }

      setIsProjectModalOpen(false);
      setProjectToDelete(null);

      dialog.alert({
        message: "프로젝트가 삭제되었습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
      dialog.alert({ message: "프로젝트 삭제 실패", variant: "error" });
    }
  };

  // 부서 선택 핸들러
  const handleSelectDepartment = (deptId: number | null) => {
    if (isManager) return;
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
          onDeleteClick={handleDeleteDepartment} // [수정] 핸들러 직접 전달
          onSelectDept={handleSelectDepartment}
          selectedDeptId={selectedDepartmentId}
          readOnly={isManager}
          isLoading={isLoading}
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
          currentUserRole={user?.role}
          currentUserDeptId={user?.departmentId}
          isLoading={isLoading}
        />
      </div>

      {/* 프로젝트 삭제 모달 (유지) */}
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

      {/* [삭제] SimpleConfirmModal 렌더링 제거 */}
    </div>
  );
};

export default DeptProjectAdminPage;
