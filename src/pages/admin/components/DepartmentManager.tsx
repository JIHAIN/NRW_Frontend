import React, { useState, type FC, useMemo, useEffect } from "react";
import { Trash2, Plus, Search, Loader2 } from "lucide-react";
import type { Department } from "@/types/UserType";
import Pagination from "../../project/components/Pagination";

interface DepartmentManagerProps {
  departments: Department[];
  onAdd: (name: string) => void;
  onDeleteClick: (dept: Department) => void;
  onSelectDept: (id: number | null) => void;
  selectedDeptId: number | null;
  readOnly?: boolean;
  isLoading?: boolean; //  추가됨
}

const ITEMS_PER_PAGE: number = 10;

const DepartmentManager: FC<DepartmentManagerProps> = ({
  departments,
  onAdd,
  onDeleteClick,
  onSelectDept,
  selectedDeptId,
  readOnly,
  isLoading = false, // 기본값
}) => {
  const [newDeptName, setNewDeptName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    onAdd(newDeptName);
    setNewDeptName("");
  };

  const filteredDepartments = useMemo(() => {
    if (!searchText) return departments;
    const lowerCaseSearch = searchText.toLowerCase();
    return departments.filter(
      (dept) =>
        dept.dept_name.toLowerCase().includes(lowerCaseSearch) ||
        String(dept.id).includes(searchText)
    );
  }, [departments, searchText]);

  const totalItems = filteredDepartments.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return filteredDepartments.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredDepartments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText]);

  const handleDepartmentClick = (id: number) => {
    if (readOnly) return;
    const newId = selectedDeptId === id ? null : id;
    onSelectDept(newId);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-end mb-2">
        <h2 className="text-[1.1rem] font-bold text-gray-800">
          부서 관리
          {isLoading && (
            <Loader2
              size={14}
              className="inline ml-2 animate-spin text-blue-500"
            />
          )}
        </h2>
        {readOnly && (
          <span className="text-xs text-gray-500">
            * 부서 관리는 총괄 관리자 전용입니다.
          </span>
        )}
      </div>

      {!readOnly && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="추가할 부서 이름"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
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
      )}

      <div className="flex items-center border border-blue-200 rounded-md p-1 bg-white mb-4">
        <Search size={18} className="text-gray-400 mx-2" />
        <input
          type="text"
          placeholder="부서 검색"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full p-1 focus:outline-none text-sm"
        />
      </div>

      <div className="grow overflow-y-auto">
        <ul className="space-y-2">
          {currentTableData.map((dept) => {
            const isSelected = selectedDeptId === dept.id;
            const isDisabled = readOnly && !isSelected;

            return (
              <li
                key={dept.id}
                onClick={() => handleDepartmentClick(dept.id)}
                className={`flex justify-between items-center p-3 rounded-md transition-colors border border-blue-50 
                ${
                  isSelected
                    ? "bg-blue-500 text-white border-blue-500 font-bold"
                    : "bg-blue-50 text-gray-800 hover:bg-blue-100"
                }
                ${readOnly ? "cursor-default" : "cursor-pointer"}
                ${isDisabled ? "opacity-50" : ""}
                `}
              >
                <span className="font-medium">
                  {dept.dept_name}
                  <span
                    className={`text-xs ml-2 ${
                      isSelected ? "text-blue-200" : "text-gray-500"
                    }`}
                  >
                    (ID: {dept.id})
                  </span>
                </span>

                {!readOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(dept);
                    }}
                    disabled={isLoading} //  로딩 중 비활성화
                    className={`p-1 rounded-full hover:bg-red-50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                      isSelected
                        ? "text-red-300 hover:text-white hover:bg-red-600"
                        : "text-red-500"
                    }`}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </li>
            );
          })}
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

export default DepartmentManager;
