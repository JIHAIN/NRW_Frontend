import React, { useState, type FC, useMemo, useEffect } from "react";
import { Trash2, Plus, Search, Loader2 } from "lucide-react";
import type { Department, Project, UserRole } from "@/types/UserType";
import Pagination from "../../project/components/Pagination";
import { FilterCombobox } from "@/components/common/FilterCombobox";
import { useDialogStore } from "@/store/dialogStore";

interface OptionItem<T> {
  value: T;
  label: string;
}

interface ProjectManagerProps {
  projects: Project[];
  departments: Department[];
  onAdd: (name: string, departmentId: number) => void;
  onDeleteClick: (project: Project) => void;
  selectedDeptId: number | null;
  onSelectDept: (id: number | null) => void;
  currentUserRole?: UserRole;
  currentUserDeptId?: number;
  isLoading?: boolean; //  추가됨
}

const ITEMS_PER_PAGE: number = 10;

const ProjectManager: FC<ProjectManagerProps> = ({
  projects,
  departments,
  onAdd,
  onDeleteClick,
  selectedDeptId,
  onSelectDept,
  currentUserRole,
  currentUserDeptId,
  isLoading = false,
}) => {
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDeptId, setNewProjectDeptId] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const isManager = currentUserRole === "MANAGER";

  const dialog = useDialogStore();

  // 초기 부서 ID 설정
  useEffect(() => {
    if (isManager && currentUserDeptId) {
      setNewProjectDeptId(currentUserDeptId);
    } else if (!isManager && departments.length > 0) {
      // 기존 0(전체) 대신 실제 부서 ID가 선택되도록 (없으면 첫번째)
      if (newProjectDeptId === 0) {
        setNewProjectDeptId(selectedDeptId || departments[0]?.id || 0);
      }
    }
  }, [
    isManager,
    currentUserDeptId,
    departments,
    selectedDeptId,
    newProjectDeptId,
  ]);

  const addFormDeptOptions: OptionItem<number>[] = useMemo(
    () => departments.map((d) => ({ value: d.id, label: d.dept_name })),
    [departments]
  );

  const filterDeptOptions: OptionItem<number>[] = useMemo(
    () => [
      { value: 0, label: "전체 부서" },
      ...departments.map((d) => ({ value: d.id, label: d.dept_name })),
    ],
    [departments]
  );

  const handleAddFormDeptChange = (value: number) => {
    setNewProjectDeptId(value);
  };

  const handleFilterDropdownChange = (value: number) => {
    onSelectDept(value === 0 ? null : value);
  };

  const currentSelectedDeptForFilter =
    selectedDeptId === null ? 0 : selectedDeptId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || newProjectDeptId === 0) {
      dialog.alert({
        message: "프로젝트 이름과 부서를 확인해주세요.",
        variant: "error",
      });
      return;
    }
    onAdd(newProjectName, newProjectDeptId);
    setNewProjectName("");
  };

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (selectedDeptId !== null) {
      result = result.filter((proj) => proj.departmentId === selectedDeptId);
    }
    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      result = result.filter((proj) =>
        proj.name.toLowerCase().includes(lowerCaseSearch)
      );
    }
    return result;
  }, [projects, selectedDeptId, searchText]);

  const totalItems = filteredProjects.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return filteredProjects.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredProjects]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDeptId, searchText]);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-[1.1rem] font-bold text-gray-800 mb-2">
        프로젝트 관리
        {isLoading && (
          <Loader2
            size={14}
            className="inline ml-2 animate-spin text-blue-500"
          />
        )}
      </h2>

      <form onSubmit={handleSubmit} className="flex gap-4 mb-4">
        <FilterCombobox<number>
          options={addFormDeptOptions}
          selectedValue={newProjectDeptId}
          onValueChange={handleAddFormDeptChange}
          placeholder={"팀 선택"}
          className="max-w-[130px] text-sm"
          disabled={isManager || isLoading} //  로딩 중 비활성화
        />

        <input
          type="text"
          placeholder={
            isManager ? "프로젝트 이름 입력" : "팀 선택 후 프로젝트 이름 입력"
          }
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          disabled={isLoading} //  로딩 중 비활성화
          className="w-full p-2 focus:outline-none text-sm border border-blue-200 rounded-md disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={isLoading} //  로딩 중 비활성화
          className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 flex items-center cursor-pointer min-w-[70px] justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Plus size={18} className="mr-1" /> 추가
        </button>
      </form>

      <div className="flex gap-4 mb-4">
        <FilterCombobox<number>
          options={filterDeptOptions}
          selectedValue={currentSelectedDeptForFilter}
          onValueChange={handleFilterDropdownChange}
          placeholder={"전체 부서"}
          className="max-w-[130px] text-sm"
          disabled={isManager}
        />

        <div className="flex items-center border border-blue-200 rounded-md p-1 bg-white grow">
          <Search size={18} className="text-gray-400 mx-2" />
          <input
            type="text"
            placeholder="프로젝트 검색"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full p-1 focus:outline-none text-sm"
          />
        </div>
      </div>

      <div className="grow overflow-y-auto">
        <ul className="space-y-2">
          {currentTableData.map((proj) => (
            <li
              key={proj.id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-100"
            >
              <div className="font-medium text-gray-700">
                {proj.name}
                <span className="text-xs text-gray-500 ml-2">
                  (
                  {departments.find((d) => d.id === proj.departmentId)
                    ?.dept_name || "삭제된 부서"}
                  )
                </span>
              </div>
              <button
                onClick={() => onDeleteClick(proj)}
                disabled={isLoading} //  로딩 중 비활성화
                className="text-red-500 p-1 rounded-full hover:bg-red-200 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
        {totalItems === 0 && (
          <div className="text-center py-8 text-gray-500">
            데이터가 없습니다.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default ProjectManager;
