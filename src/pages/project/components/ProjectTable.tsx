// ProjectTable.tsx
import React, { useState, useMemo } from "react";
import TableBody from "./TableBody";
import Pagination from "./Pagination";
import TableControls from "./TableControls";
import { useDebounce } from "../../../hooks/use_Debounce";
import {
  DUMMY_DOCUMENTS,
  DUMMY_PROJECTS,
  DUMMY_DEPARTMENTS,
} from "@/types/dummy_data";
import type { Document } from "@/types/UserType";

// 더미데이터
const ALL_DOCUMENTS: Document[] = DUMMY_DOCUMENTS;

const ITEMS_PER_PAGE: number = 10;

// ✨ ProjectTable 컴포넌트 Props 정의 ✨
interface ProjectTableProps {
  selectedDepartment: string;
  selectedProject: string;
}

export function ProjectTable({
  selectedDepartment,
  selectedProject,
}: ProjectTableProps): React.ReactElement {
  //  필터 상태 관리
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");

  // ✨ 체크박스 상태 관리 (이전 구현 포함) ✨
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(
    new Set()
  );

  //  검색어에 디바운스 적용
  const debouncedSearchText = useDebounce<string>(searchText, 300);

  // ✨ 1. 프로젝트 부서 여부 확인 로직 추가 ✨
  const isReadyToDisplay = selectedDepartment && selectedProject;

  // 1. 데이터 필터링 (부서/프로젝트 -> 검색/상태/위치 순)
  const filteredData: Document[] = useMemo(() => {
    if (!isReadyToDisplay) {
      return [];
    }

    let result = ALL_DOCUMENTS;

    const deptId = DUMMY_DEPARTMENTS.find(
      (d) => d.name === selectedDepartment
    )?.id;
    const projId = DUMMY_PROJECTS.find((p) => p.name === selectedProject)?.id;

    // a. 프로젝트 필터링 (선택된 프로젝트만으로 필터링)
    if (projId) {
      result = result.filter((item) => item.projectId === projId);
    } else if (deptId) {
      // b. 프로젝트가 선택되지 않고 부서만 선택된 경우: 해당 부서 소속 프로젝트 문서를 모두 표시
      const projectIdsInDept = DUMMY_PROJECTS.filter(
        (p) => p.departmentId === deptId
      ).map((p) => p.id);
      result = result.filter((item) =>
        projectIdsInDept.includes(item.projectId)
      );
    }

    // c. 문서 이름 검색 필터링
    if (debouncedSearchText) {
      const lowerCaseSearch = debouncedSearchText.toLowerCase();
      result = result.filter((item) =>
        item.name.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // d. 상태 필터링
    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }

    // e. 위치 필터링
    if (locationFilter) {
      result = result.filter((item) => item.location === locationFilter);
    }

    return result;
  }, [
    selectedDepartment,
    selectedProject,
    debouncedSearchText,
    statusFilter,
    locationFilter,
  ]);

  // 페이지네이션 로직
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalItems: number = filteredData.length;
  const totalPages: number = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // 페이지 이동 시, 필터링된 데이터가 변경되면 1페이지로 돌아가도록 처리 및 선택 초기화
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedItemIds(new Set()); // 필터 변경 시 선택된 항목 초기화
  }, [
    selectedDepartment,
    selectedProject,
    debouncedSearchText,
    statusFilter,
    locationFilter,
  ]);

  // 2. 현재 페이지에 보여줄 데이터 슬라이싱
  const currentTableData: Document[] = useMemo(() => {
    const firstPageIndex: number = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex: number = firstPageIndex + ITEMS_PER_PAGE;
    return filteredData.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredData]);

  // ✨ 체크박스 로직 (통합) ✨
  const isAllSelected: boolean =
    currentTableData.length > 0 &&
    currentTableData.every((item) => selectedItemIds.has(item.id));
  const hasSelection: boolean = selectedItemIds.size > 0;

  const handleCheckboxChange = (itemId: number, isChecked: boolean) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAllChange = (isChecked: boolean) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (isChecked) {
        currentTableData.forEach((item) => newSet.add(item.id));
      } else {
        currentTableData.forEach((item) => newSet.delete(item.id));
      }
      return newSet;
    });
  };

  const handleBulkAction = (type: "download" | "delete") => {
    const selectedItems = ALL_DOCUMENTS.filter((item) =>
      selectedItemIds.has(item.id)
    );
    if (type === "download") {
      alert(`${selectedItems.length}개의 문서를 다운로드합니다.`);
    } else if (type === "delete") {
      if (
        confirm(
          `선택된 ${selectedItems.length}개의 문서를 정말 삭제하시겠습니까?`
        )
      ) {
        alert("삭제 처리 완료.");
        setSelectedItemIds(new Set());
      }
    }
  };
  // -------------------------

  // 3. 필터 드롭다운 옵션 추출
  const statusOptions: string[] = useMemo(
    () => Array.from(new Set(ALL_DOCUMENTS.map((item) => item.status))),
    []
  );
  const locationOptions: string[] = useMemo(
    () => Array.from(new Set(ALL_DOCUMENTS.map((item) => item.location))),
    []
  );

  const handleAction = (type: "download" | "delete", item: Document): void => {
    alert(`${item.name}을(를) ${type}합니다.`);
  };

  return (
    <div className="w-full  rounded-lg  bg-white">
      {/* ⏫ Table Controls 컴포넌트 추가 */}
      <TableControls
        searchText={searchText}
        onSearchChange={setSearchText}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        locationFilter={locationFilter}
        onLocationFilterChange={setLocationFilter}
        statusOptions={statusOptions}
        locationOptions={locationOptions}
        // ✨ 체크박스 관련 props 전달 ✨
        hasSelection={hasSelection}
        onBulkDownload={() => handleBulkAction("download")}
        onBulkDelete={() => handleBulkAction("delete")}
      />

      {/* ✨ 3. 조건부 렌더링 ✨ */}
      {!isReadyToDisplay ? (
        // 부서 또는 프로젝트가 선택되지 않았을 때
        <div className="text-center p-8 text-gray-500">
          상단의 부서와 프로젝트를 선택해주세요.
        </div>
      ) : (
        // 부서와 프로젝트가 모두 선택되었을 때 테이블 표시
        <>
          {/* 📋 테이블 헤더 */}
          <header className="flex items-center text-sm font-semibold text-gray-600 bg-gray-50 p-3">
            {/* ... (헤더 내용 유지) ... */}
            <div className="w-1/12 text-center">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={isAllSelected}
                onChange={(e) => handleSelectAllChange(e.target.checked)}
              />
            </div>
            <div className="w-3/12">문서 이름</div>
            <div className="w-2/12">문서 위치</div>
            <div className="w-[10%] flex items-center gap-1 cursor-pointer">
              생성 일자
            </div>
            <div className="w-[10%]">상태</div>
            <div className="w-[10%]">완료 일자</div>
            <div className="w-2/12 text-center">관리</div>
          </header>

          {/* 📑 테이블 본문 */}
          {currentTableData.length > 0 ? (
            <TableBody
              data={currentTableData}
              onAction={handleAction}
              selectedItemIds={selectedItemIds}
              onCheckboxChange={handleCheckboxChange}
            />
          ) : (
            <div className="text-center p-8 text-gray-500">
              검색 결과에 해당하는 문서가 없습니다.
            </div>
          )}

          {/* 🔢 페이지네이션 컴포넌트 */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
