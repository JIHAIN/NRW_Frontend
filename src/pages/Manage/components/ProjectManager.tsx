// src/pages/manage/components/ProjectManager.tsx

import React, { useState, type FC, useMemo, useEffect } from "react";
import { Trash2, Plus, Search } from "lucide-react";
import type { Department, Project } from "@/types/UserType";
import Pagination from "../../project/components/Pagination";
import { FilterCombobox } from "@/components/common/FilterCombobox";
// 💡 FilterCombobox 임포트

// FilterCombobox에서 사용될 OptionItem 타입 (number|null 값으로 사용)
interface OptionItem<T> {
  value: T;
  label: string;
}

interface ProjectManagerProps {
  projects: Project[];
  departments: Department[];
  onAdd: (name: string, departmentId: number) => void;
  onDeleteClick: (project: Project) => void; // 모달을 띄우기 위해 Project 객체를 받음
  selectedDeptId: number | null; // 상위 컴포넌트에서 선택된 부서 ID
  onSelectDept: (id: number | null) => void; // 드롭다운 변경 시 상위 컴포넌트 상태 업데이트
}

const ITEMS_PER_PAGE: number = 10;

const ProjectManager: FC<ProjectManagerProps> = ({
  projects,
  departments,
  onAdd,
  onDeleteClick,
  selectedDeptId,
  onSelectDept,
}) => {
  const [newProjectName, setNewProjectName] = useState("");
  // 프로젝트 추가 시 선택할 부서 ID (기본값은 부서 목록의 첫 ID)
  const [newProjectDeptId, setNewProjectDeptId] = useState(
    departments[0]?.id || 0 // 0이 '전체'가 아닌 실제 부서 ID여야 함 (추가 폼이므로)
  );

  // 💡 프로젝트 검색 상태 및 페이지 상태 추가
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // -----------------------------------------------------------------------
  // 💡 FilterCombobox 옵션 정의
  // -----------------------------------------------------------------------
  // 1. 추가 폼 옵션 (ID: number, '전체 부서' 옵션 제외)
  const addFormDeptOptions: OptionItem<number>[] = useMemo(
    () => departments.map((d) => ({ value: d.id, label: d.name })),
    [departments]
  );

  // 2. 필터 옵션 (ID: number, 0은 '전체 부서'를 의미하는 값)
  const filterDeptOptions: OptionItem<number>[] = useMemo(
    () => [
      // 필터는 첫 번째 옵션이 선택 해제용 '전체'여야 합니다.
      { value: 0, label: "전체 부서" },
      ...departments.map((d) => ({ value: d.id, label: d.name })),
    ],
    [departments]
  );

  // -----------------------------------------------------------------------
  // 💡 핸들러 정의
  // -----------------------------------------------------------------------

  // 💡 프로젝트 추가 폼 드롭다운 변경 핸들러
  const handleAddFormDeptChange = (value: number) => {
    // 폼에서는 '전체 부서' 선택이 없다고 가정하고, ID만 업데이트
    setNewProjectDeptId(value);
  };

  // 💡 필터 드롭다운 변경 핸들러
  const handleFilterDropdownChange = (value: number) => {
    // value가 0이면 null을, 아니면 해당 ID를 상위 상태로 전달
    onSelectDept(value === 0 ? null : value);
  };

  // 현재 필터 드롭다운에 표시할 부서 ID (전체가 선택된 경우 0)
  const currentSelectedDeptForFilter =
    selectedDeptId === null ? 0 : selectedDeptId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 폼용 부서 ID가 0이거나 이름이 없으면 리턴
    if (!newProjectName.trim() || newProjectDeptId === 0) {
      alert("프로젝트 이름과 부서를 모두 선택해주세요.");
      return;
    }
    onAdd(newProjectName, newProjectDeptId);
    setNewProjectName("");
  };

  // 💡 1. 필터링 및 검색 로직 (기존 로직 유지)
  const filteredProjects = useMemo(() => {
    let result = projects;

    // 1-1. 부서 ID 필터링
    if (selectedDeptId !== null) {
      result = result.filter((proj) => proj.departmentId === selectedDeptId);
    }

    // 1-2. 검색 필터링
    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      result = result.filter((proj) =>
        proj.name.toLowerCase().includes(lowerCaseSearch)
      );
    }

    return result;
  }, [projects, selectedDeptId, searchText]);

  // 💡 2. 페이지네이션 계산 (기존 로직 유지)
  const totalItems = filteredProjects.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // 💡 3. 현재 페이지 데이터 슬라이싱 (기존 로직 유지)
  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return filteredProjects.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredProjects]);

  // 💡 4. 필터/검색 변경 시 페이지 초기화 (기존 로직 유지)
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDeptId, searchText]);

  return (
    <div className=" flex flex-col h-full">
      <h2 className="text-[1.1rem] font-bold text-gray-800 mb-2">
        프로젝트 관리
      </h2>

      {/* 프로젝트 추가 폼 */}
      <form onSubmit={handleSubmit} className="flex gap-4 mb-4 ">
        {/* 💡 부서 선택 드롭다운 (추가용) - FilterCombobox 적용 */}
        <FilterCombobox<number> // 💡 제네릭 타입 명시
          options={addFormDeptOptions}
          selectedValue={newProjectDeptId}
          onValueChange={handleAddFormDeptChange}
          placeholder={"팀 선택"}
          className="max-w-[130px] text-sm" // 스타일 유지
        />

        {/* 프로젝트 이름 입력 */}
        <input
          type="text"
          placeholder="팀 선택후 추가할 프로젝트 이름을 입력 해주세요."
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          className="w-full p-2 focus:outline-none text-sm border border-blue-200 rounded-md"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 flex items-center cursor-pointer min-w-[70px] justify-center"
        >
          <Plus size={18} className="mr-1" /> 추가
        </button>
      </form>

      {/* 💡 필터링 드롭다운 및 검색 필드 */}
      <div className="flex gap-4 mb-4">
        {/* 💡 필터 드롭다운 - FilterCombobox 적용 */}
        <FilterCombobox<number> // 💡 제네릭 타입 명시
          options={filterDeptOptions}
          selectedValue={currentSelectedDeptForFilter}
          onValueChange={handleFilterDropdownChange}
          placeholder={"전체 부서"}
          className="max-w-[130px] text-sm" // 스타일 유지
        />

        <div className="flex items-center border border-blue-200 rounded-md p-1 bg-white grow">
          <Search size={18} className="text-gray-400 mx-2" />
          <input
            type="text"
            placeholder="프로젝트 이름 검색"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full p-1 focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* 프로젝트 목록 */}
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
                  {departments.find((d) => d.id === proj.departmentId)?.name ||
                    "N/A"}
                  )
                </span>
              </div>
              <button
                onClick={() => onDeleteClick(proj)}
                className="text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                title="프로젝트 삭제"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
        {totalItems === 0 && (
          <div className="text-center py-8 text-gray-500">
            {selectedDeptId !== null
              ? `선택된 부서에 해당하는 프로젝트가 없습니다.`
              : searchText
              ? `검색 결과에 해당하는 프로젝트가 없습니다.`
              : `등록된 프로젝트가 없습니다.`}
          </div>
        )}
      </div>

      {/* 💡 페이지네이션 */}
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
