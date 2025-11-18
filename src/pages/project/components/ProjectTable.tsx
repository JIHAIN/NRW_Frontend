import React, { useState, useMemo, useEffect } from "react";
import TableBody from "./TableBody";
import Pagination from "./Pagination";
import TableControls from "./TableControls";
import { useDebounce } from "@/hooks/useDebounce";

// ✨ React Query & API Service
import { useQuery } from "@tanstack/react-query";
import { fetchDocuments, downloadDocument } from "@/services/documents.service";

// Store & Type
import { useSystemStore } from "@/store/systemStore";
import type {
  Document,
  DocumentStatus,
  DocumentCategory,
} from "@/types/UserType";
import { STATUS_FILTERS, CATEGORY_FILTERS } from "@/constants/projectConstants";

// ❌ Mock Data 삭제! (이제 필요 없음)

const ITEMS_PER_PAGE = 10;

interface ProjectTableProps {
  selectedDepartment: string;
  selectedProject: string;
  currentUserRole: string;
}

export function ProjectTable({
  selectedDepartment,
  selectedProject,
  currentUserRole,
}: ProjectTableProps): React.ReactElement {
  const { departments, projects } = useSystemStore();

  // ✨ [핵심] API로 실제 문서 목록 가져오기
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  // 상태 관리
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | "">(
    ""
  );
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(
    new Set()
  );
  const [currentPage, setCurrentPage] = useState<number>(1);

  const debouncedSearchText = useDebounce<string>(searchText, 300);
  const roleUpper = currentUserRole ? currentUserRole.toUpperCase() : "";
  const canManage = roleUpper === "SUPER_ADMIN" || roleUpper === "MANAGER";

  // ✨ 필터링 로직 (Mock 대신 documents 데이터 사용)
  const filteredData: Document[] = useMemo(() => {
    // 1. API 로딩 중이거나 데이터 없으면 빈 배열
    if (isLoading || !documents) return [];

    let result = documents;

    // 2. 부서/프로젝트 필터링 (선택된 경우만)
    // 주의: 현재 API가 departmentId, project_id를 안 줘서(0으로 설정됨),
    //       '전체 보기'가 아니면 데이터가 안 나올 수 있습니다.
    //       일단 필터링 로직은 유지하되, 데이터가 없어서 안 나오는 건 정상입니다.
    const deptId = departments.find((d) => d.name === selectedDepartment)?.id;
    const projId = projects.find((p) => p.name === selectedProject)?.id;

    if (projId) {
      result = result.filter((item) => item.projectId === projId);
    } else if (deptId) {
      result = result.filter((item) => item.departmentId === deptId);
    }

    // 3. 검색어 필터
    if (debouncedSearchText) {
      const lowerCaseSearch = debouncedSearchText.toLowerCase();
      result = result.filter((item) =>
        item.originalFilename.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // 4. 상태 필터
    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }

    // 5. 카테고리 필터
    if (categoryFilter) {
      result = result.filter((item) => item.category === categoryFilter);
    }

    return result;
  }, [
    selectedDepartment,
    selectedProject,
    debouncedSearchText,
    statusFilter,
    categoryFilter,
    documents, // ✨ API 데이터 의존성
    isLoading,
    departments,
    projects,
  ]);

  // 페이지네이션 계산
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedItemIds(new Set());
  }, [
    selectedDepartment,
    selectedProject,
    debouncedSearchText,
    statusFilter,
    categoryFilter,
  ]);

  const currentTableData = useMemo(() => {
    const firstIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(firstIndex, firstIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredData]);

  // 체크박스 핸들러 (기존 유지)
  const isAllSelected =
    currentTableData.length > 0 &&
    currentTableData.every((item) => selectedItemIds.has(item.id));
  const hasSelection = selectedItemIds.size > 0;
  const handleCheckboxChange = (itemId: number, isChecked: boolean) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      // 수정됨: 삼항 연산자 -> if 문
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
      // 수정됨: 삼항 연산자 -> if 문
      if (isChecked) {
        currentTableData.forEach((i) => newSet.add(i.id));
      } else {
        currentTableData.forEach((i) => newSet.delete(i.id));
      }
      return newSet;
    });
  };

  // 액션 핸들러
  const handleAction = async (type: "download" | "delete", item: Document) => {
    if (type === "download") {
      try {
        // API 명세에 맞춰 userId와 docId(파일명) 전달
        // item.userId는 숫자형이므로 문자열로 변환하되, "user=1" 포맷이 필요한지는 백엔드 확인 후 적용
        // 일단 "user=숫자" 포맷으로 시도해봅니다.
        const userIdParam = `user=${item.userId}`;
        await downloadDocument(
          userIdParam,
          item.originalFilename,
          item.originalFilename
        );
      } catch (error) {
        console.error("Download failed:", error);
        alert("다운로드에 실패했습니다.");
      }
    } else if (type === "delete") {
      alert("삭제 기능은 아직 연결되지 않았습니다.");
    }
  };

  const handleBulkAction = (type: "download" | "delete") => {
    if (type !== null) alert("일괄 작업은 아직 준비 중입니다.");
  };

  // 옵션
  const statusOptions = useMemo(() => STATUS_FILTERS, []);
  const categoryOptions = useMemo(() => CATEGORY_FILTERS, []);

  return (
    <div className="w-full rounded-lg bg-white">
      <TableControls
        searchText={searchText}
        onSearchChange={setSearchText}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => setStatusFilter(val as DocumentStatus)}
        statusOptions={statusOptions}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={(val) =>
          setCategoryFilter(val as DocumentCategory)
        }
        categoryOptions={categoryOptions}
        hasSelection={hasSelection}
        onBulkDownload={() => handleBulkAction("download")}
        onBulkDelete={canManage ? () => handleBulkAction("delete") : undefined}
      />

      {/* ✨ 로딩 상태 표시 */}
      {isLoading ? (
        <div className="text-center p-12 text-gray-500">
          데이터를 불러오는 중입니다...
        </div>
      ) : (
        <>
          <header className="flex items-center text-sm font-semibold text-gray-600 bg-gray-50 p-3">
            {/* ... 헤더 동일 ... */}
            <div className="w-1/12 text-center">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={isAllSelected}
                onChange={(e) => handleSelectAllChange(e.target.checked)}
              />
            </div>
            <div className="w-3/12">문서 이름</div>
            <div className="w-2/12">분류</div>
            <div className="w-[10%] cursor-pointer">생성 일자</div>
            <div className="w-[10%]">상태</div>
            <div className="w-[10%]">업데이트</div>
            <div className="w-2/12 text-center">관리</div>
          </header>

          {currentTableData.length > 0 ? (
            <TableBody
              data={currentTableData}
              onAction={handleAction}
              selectedItemIds={selectedItemIds}
              onCheckboxChange={handleCheckboxChange}
              canManage={canManage}
            />
          ) : (
            <div className="text-center p-8 text-gray-500">
              {/* 필터 때문에 안 보이는 건지, 진짜 없는 건지 구분 */}
              {documents.length === 0
                ? "등록된 문서가 없습니다."
                : "조건에 맞는 문서가 없습니다."}
            </div>
          )}

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
