import React, { useState, useMemo, useEffect } from "react";
import TableBody from "./TableBody";
import Pagination from "./Pagination";
import TableControls, { type OptionItem } from "./TableControls";
import { useDebounce } from "@/hooks/useDebounce";

import { useQuery } from "@tanstack/react-query";
import { fetchDocuments, downloadDocument } from "@/services/documents.service";

import { useSystemStore } from "@/store/systemStore";
import type {
  Document,
  DocumentStatus,
  DocumentCategory,
} from "@/types/UserType";
import { STATUS_FILTERS, CATEGORY_FILTERS } from "@/constants/projectConstants";
import { DocumentDetailModal } from "./modal/DocumentDetailModal";

const ITEMS_PER_PAGE = 10;

interface ProjectTableProps {
  selectedDeptId: number;
  currentUserRole: string;
}

export function ProjectTable({
  selectedDeptId,
  currentUserRole,
}: ProjectTableProps): React.ReactElement {
  const { projects } = useSystemStore();

  // 1. [수정] 프로젝트 필터 상태 (기본값 "1"로 설정)
  // 선택된 부서 내에서 프로젝트를 바꾸면 이 state가 변하고, 아래 useQuery가 다시 실행됩니다.
  const [projectFilter, setProjectFilter] = useState<string>("1");

  // 2. [수정] API 호출부 변경 (Server-side Filtering)
  // queryKey에 deptId와 projectId를 포함시켜, 값이 바뀔 때마다 자동으로 refetch 됩니다.
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", selectedDeptId, projectFilter],
    queryFn: () =>
      fetchDocuments(Number(selectedDeptId), Number(projectFilter)),
    // ID가 없으면 호출하지 않음 (안전장치)
    enabled: !!selectedDeptId && !!projectFilter,
  });

  // 나머지 상태 관리
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | "">(
    ""
  );

  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(
    new Set()
  );
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 상세 모달 상태
  const [detailDoc, setDetailDoc] = useState<Document | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const debouncedSearchText = useDebounce<string>(searchText, 300);
  const roleUpper = currentUserRole ? currentUserRole.toUpperCase() : "";
  const canManage = roleUpper === "SUPER_ADMIN" || roleUpper === "MANAGER";

  // 3. 프로젝트 옵션 생성 (선택된 부서에 맞는 프로젝트만 표시)
  const projectOptions: OptionItem[] = useMemo(() => {
    if (!selectedDeptId) return [];
    return projects
      .filter((p) => p.departmentId === selectedDeptId)
      .map((p) => ({
        value: String(p.id),
        label: p.name,
      }));
  }, [selectedDeptId, projects]);

  // 4. [수정] 부서가 바뀌면 프로젝트를 다시 '1번'으로 초기화
  // (만약 해당 부서의 첫 번째 프로젝트로 하고 싶다면 logic 수정 가능)
  useEffect(() => {
    setProjectFilter("1");
  }, [selectedDeptId]);

  // 5. [수정] 데이터 필터링 (Client-side)
  // 서버에서 이미 Dept/Project에 맞는 데이터를 가져오므로, 여기서는 검색어/상태/분류만 필터링합니다.
  const filteredData: Document[] = useMemo(() => {
    if (isLoading || !documents) return [];

    let result = documents;

    // (기존 부서/프로젝트 ID 필터링 로직 제거 -> API가 처리함)

    // (1) 검색어 필터
    if (debouncedSearchText) {
      const lowerCaseSearch = debouncedSearchText.toLowerCase();
      result = result.filter((item) =>
        item.originalFilename.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // (2) 상태 필터
    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }

    // (3) 카테고리 필터
    if (categoryFilter) {
      result = result.filter((item) => item.category === categoryFilter);
    }

    return result;
  }, [debouncedSearchText, statusFilter, categoryFilter, documents, isLoading]);

  // 페이지네이션 및 선택 로직
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // 필터 변경 시 페이지/선택 초기화
  useEffect(() => {
    setCurrentPage(1);
    setSelectedItemIds(new Set());
  }, [
    selectedDeptId,
    projectFilter,
    debouncedSearchText,
    statusFilter,
    categoryFilter,
  ]);

  const currentTableData = useMemo(() => {
    const firstIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(firstIndex, firstIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredData]);

  const isAllSelected =
    currentTableData.length > 0 &&
    currentTableData.every((item) => selectedItemIds.has(item.id));
  const hasSelection = selectedItemIds.size > 0;

  const handleCheckboxChange = (itemId: number, isChecked: boolean) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (isChecked) newSet.add(itemId);
      else newSet.delete(itemId);
      return newSet;
    });
  };

  const handleSelectAllChange = (isChecked: boolean) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (isChecked) currentTableData.forEach((i) => newSet.add(i.id));
      else currentTableData.forEach((i) => newSet.delete(i.id));
      return newSet;
    });
  };

  const handleAction = async (type: "download" | "delete", item: Document) => {
    if (type === "download") {
      try {
        await downloadDocument(item.id, item.originalFilename);
      } catch (error) {
        console.error("Download failed:", error);
        alert("다운로드에 실패했습니다.");
      }
    } else if (type === "delete") {
      alert("삭제 기능 준비 중");
    }
  };

  const handleTitleClick = (doc: Document) => {
    setDetailDoc(doc);
    setIsDetailOpen(true);
  };

  return (
    <div className="w-full h-full flex flex-col rounded-lg bg-white shadow-sm">
      <div className="flex-none p-2">
        <TableControls
          searchText={searchText}
          onSearchChange={setSearchText}
          // [수정] 프로젝트 필터 연동
          projectFilter={projectFilter}
          onProjectFilterChange={setProjectFilter}
          projectOptions={projectOptions}
          statusFilter={statusFilter}
          onStatusFilterChange={(val) => setStatusFilter(val as DocumentStatus)}
          statusOptions={STATUS_FILTERS}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={(val) =>
            setCategoryFilter(val as DocumentCategory)
          }
          categoryOptions={CATEGORY_FILTERS}
          hasSelection={hasSelection}
          onBulkDownload={() => {}}
          onBulkDelete={canManage ? () => {} : undefined}
        />
      </div>

      <header className="flex-none flex items-center text-sm font-semibold text-gray-600 bg-gray-50 p-3 border-t border-gray-100">
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
        <div className="w-[10%]">생성 일자</div>
        <div className="w-[10%]">상태</div>
        <div className="w-[10%]">업데이트</div>
        <div className="w-2/12 text-center">관리</div>
      </header>

      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="text-center p-12 text-gray-500">
            데이터를 불러오는 중입니다...
          </div>
        ) : (
          <>
            {currentTableData.length > 0 ? (
              <TableBody
                data={currentTableData}
                onAction={handleAction}
                selectedItemIds={selectedItemIds}
                onCheckboxChange={handleCheckboxChange}
                canManage={canManage}
                onTitleClick={handleTitleClick}
              />
            ) : (
              <div className="text-center p-8 text-gray-500">
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

      <DocumentDetailModal
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        document={detailDoc}
      />
    </div>
  );
}
