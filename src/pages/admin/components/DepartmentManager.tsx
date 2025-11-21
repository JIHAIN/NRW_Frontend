// src/pages/manage/components/DepartmentManager.tsx

import React, { useState, type FC, useMemo, useEffect } from "react";
import { Trash2, Plus, Search } from "lucide-react";
import type { Department } from "@/types/UserType";
// 💡 Pagination 컴포넌트 임포트
import Pagination from "../../project/components/Pagination";

interface DepartmentManagerProps {
  departments: Department[];
  onAdd: (name: string) => void;
  onDeleteClick: (dept: Department) => void;
  onSelectDept: (id: number | null) => void;
  selectedDeptId: number | null;
  readOnly?: boolean;
}

const ITEMS_PER_PAGE: number = 10;

const DepartmentManager: FC<DepartmentManagerProps> = ({
  departments,
  onAdd,
  onDeleteClick,
  onSelectDept,
  selectedDeptId,
  readOnly,
}) => {
  const [newDeptName, setNewDeptName] = useState("");
  const [searchText, setSearchText] = useState("");
  // 💡 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    onAdd(newDeptName);
    setNewDeptName("");
  };

  // 1. 검색 및 필터링 로직
  const filteredDepartments = useMemo(() => {
    if (!searchText) return departments;
    const lowerCaseSearch = searchText.toLowerCase();
    return departments.filter(
      (dept) =>
        dept.name.toLowerCase().includes(lowerCaseSearch) ||
        String(dept.id).includes(searchText)
    );
  }, [departments, searchText]);

  // 2. 페이지네이션 계산
  const totalItems = filteredDepartments.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // 3. 현재 페이지 데이터 슬라이싱
  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return filteredDepartments.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredDepartments]);

  // 4. 검색어 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText]);

  // 5. 부서 목록 클릭 시 핸들러 (선택 토글)
  const handleDepartmentClick = (id: number) => {
    if (readOnly) return;
    // 이미 선택된 부서를 다시 클릭하면 '전체 부서'(null)로 필터 해제
    const newId = selectedDeptId === id ? null : id;
    onSelectDept(newId);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-end mb-2">
        <h2 className="text-[1.1rem] font-bold text-gray-800">부서 관리</h2>
        {/* readOnly일 때 안내 문구 표시 (선택사항) */}
        {readOnly && (
          <span className="text-xs text-gray-500">
            * 부서 생성 및 삭제는 총괄 관리자만 가능합니다.
          </span>
        )}
      </div>

      {/* ✨ readOnly가 아닐 때(총괄 관리자)만 추가 폼 표시 */}
      {!readOnly && (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="추가할 부서 이름을 작성해 주세요."
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            className="w-full p-2 focus:outline-none text-sm border border-blue-200 rounded-md"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 flex items-center cursor-pointer min-w-[70px] justify-center"
          >
            <Plus size={18} className="mr-1" /> 추가
          </button>
        </form>
      )}

      <div className="flex items-center border border-blue-200 rounded-md p-1 bg-white mb-4">
        <Search size={18} className="text-gray-400 mx-2" />
        <input
          type="text"
          placeholder="부서 이름 또는 ID 검색"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full p-1 focus:outline-none text-sm"
        />
      </div>

      <div className="grow overflow-y-auto">
        <ul className="space-y-2">
          {currentTableData.map((dept) => {
            // 관리자 모드일 때: 선택된 부서(자기 부서)는 파랗게, 나머지는 회색 처리
            // 총괄 관리자일 때: 선택 자유
            const isSelected = selectedDeptId === dept.id;
            const isDisabled = readOnly && !isSelected; // 관리자는 자기 부서 외엔 비활성 느낌

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
                  {dept.name}
                  <span
                    className={`text-xs ml-2 ${
                      isSelected ? "text-blue-200" : "text-gray-500"
                    }`}
                  >
                    (ID: {dept.id})
                  </span>
                </span>

                {/* ✨ readOnly가 아닐 때만 삭제 버튼 표시 */}
                {!readOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(dept);
                    }}
                    className={`p-1 rounded-full hover:bg-red-50 transition-colors cursor-pointer ${
                      isSelected
                        ? "text-red-300 hover:text-white hover:bg-red-600"
                        : "text-red-500"
                    }`}
                    title="부서 삭제"
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
            {searchText
              ? "검색 결과에 해당하는 부서가 없습니다."
              : "등록된 부서가 없습니다."}
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
