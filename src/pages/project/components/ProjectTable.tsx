import React, { useState, useMemo, useEffect } from "react";
import TableBody from "./TableBody";
import Pagination from "./Pagination";
import TableControls from "./TableControls";
import { useDebounce } from "@/hooks/useDebounce";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDocuments,
  downloadDocument,
  deleteDocument,
} from "@/services/documents.service";

import { useSystemStore } from "@/store/systemStore";
import type {
  Document,
  DocumentStatus,
  DocumentCategory,
} from "@/types/UserType";
import { STATUS_FILTERS, CATEGORY_FILTERS } from "@/constants/projectConstants";
import { DocumentDetailModal } from "./modal/DocumentDetailModal";

import { useDialogStore } from "@/store/dialogStore";

const ITEMS_PER_PAGE = 10;

type FilterStatus = DocumentStatus | "ALL";
type FilterCategory = DocumentCategory | "ALL";

interface ProjectTableProps {
  selectedDeptId: number;
  currentUserRole: string;
  selectedProjectId?: number;
}

export function ProjectTable({
  selectedDeptId,
  currentUserRole,
  selectedProjectId,
}: ProjectTableProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { projects, departments } = useSystemStore();
  const dialog = useDialogStore();

  // [수정] 초기값을 ""(선택 안함)으로 설정
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(
    new Set()
  );

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canManage =
    currentUserRole === "SUPER_ADMIN" || currentUserRole === "MANAGER";
  const debouncedSearchText = useDebounce(searchText, 300);

  // [수정] 상단 프로젝트 선택 시 하단 필터 동기화
  useEffect(() => {
    if (selectedProjectId) {
      setProjectFilter(String(selectedProjectId));
    } else {
      // 상단 선택이 없으면 하단도 '선택 안함("")'으로 초기화 (기존: ALL)
      setProjectFilter("");
    }
  }, [selectedProjectId]);

  // 문서 목록 가져오기
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", selectedDeptId, projectFilter],
    queryFn: () => {
      // ALL이면 0(전체)으로 조회, 아니면 해당 ID로 조회
      const pid = projectFilter === "ALL" ? 0 : parseInt(projectFilter);
      return fetchDocuments(selectedDeptId, pid);
    },
    // [수정] 부서가 있고, 프로젝트 필터가 선택되었을 때만(ALL 포함) 조회 실행
    // projectFilter가 ""(빈 문자열)이면 조회하지 않음
    enabled: selectedDeptId > 0 && !!projectFilter,
    select: (data) =>
      data.map((doc) => ({
        ...doc,
        title: doc.originalFilename,
      })),
  });

  // 필터링 로직
  const filteredData = useMemo(() => {
    let filtered = documents;

    if (debouncedSearchText) {
      filtered = filtered.filter((doc) =>
        doc.title.toLowerCase().includes(debouncedSearchText.toLowerCase())
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((doc) => doc.status === statusFilter);
    }
    if (categoryFilter !== "ALL") {
      filtered = filtered.filter((doc) => doc.category === categoryFilter);
    }
    return filtered;
  }, [documents, debouncedSearchText, statusFilter, categoryFilter]);

  // 페이징 데이터
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentTableData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const isAllSelected =
    currentTableData.length > 0 &&
    currentTableData.every((doc) => selectedItemIds.has(doc.id));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (isChecked) {
        currentTableData.forEach((doc) => newSet.add(doc.id));
      } else {
        currentTableData.forEach((doc) => newSet.delete(doc.id));
      }
      return newSet;
    });
  };

  const selectedIdsArray = useMemo(
    () => Array.from(selectedItemIds),
    [selectedItemIds]
  );
  const selectedDocs = useMemo(() => {
    return filteredData.filter((doc) => selectedItemIds.has(doc.id));
  }, [filteredData, selectedItemIds]);

  const hasSelection = selectedItemIds.size > 0;

  const executeBulkDelete = async (ids: number[]) => {
    const deletePromises = ids.map(async (id) => {
      try {
        await deleteDocument(id);
        return { status: "fulfilled", id: id };
      } catch (error) {
        return { status: "rejected", id: id, reason: error };
      }
    });
    return Promise.allSettled(deletePromises);
  };

  const executeBulkDownload = async (docs: Document[]) => {
    const downloadPromises = docs.map(async (doc) => {
      try {
        await downloadDocument(doc.id, doc.originalFilename);
        return { status: "fulfilled", id: doc.id };
      } catch (error) {
        return { status: "rejected", id: doc.id, reason: error };
      }
    });
    return Promise.allSettled(downloadPromises);
  };

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["documents", selectedDeptId, projectFilter],
      });
      setSelectedItemIds(new Set());
      dialog.alert({
        title: "삭제 완료",
        message: "문서가 성공적으로 삭제되었습니다.",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error("문서 삭제 오류:", error);
      dialog.alert({
        title: "삭제 실패",
        message: `문서 삭제에 실패했습니다.\n(오류: ${
          error.message || "서버 응답 오류"
        })`,
        variant: "error",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: executeBulkDelete,
    onSuccess: (results) => {
      const fulfilledCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const rejectedCount = results.length - fulfilledCount;

      let message = `일괄 삭제 요청 처리가 완료되었습니다.`;
      if (fulfilledCount > 0) message += `\n✅ 성공: ${fulfilledCount}건`;
      if (rejectedCount > 0)
        message += `\n❌ 실패: ${rejectedCount}건\n(자세한 내용은 콘솔을 확인해주세요)`;

      queryClient.invalidateQueries({
        queryKey: ["documents", selectedDeptId, projectFilter],
      });
      setSelectedItemIds(new Set());

      dialog.alert({
        title: "일괄 삭제 완료",
        message: message,
        variant: rejectedCount > 0 ? "warning" : "success",
      });

      if (rejectedCount > 0)
        console.error(
          "Bulk Deletion Failures:",
          results.filter((r) => r.status === "rejected")
        );
    },
    onError: (error) => {
      console.error("Bulk Deletion initialization error:", error);
      dialog.alert({
        title: "오류 발생",
        message: "문서 일괄 삭제 요청 중 오류가 발생했습니다.",
        variant: "error",
      });
    },
  });

  const handleAction = async (type: "download" | "delete", item: Document) => {
    if (type === "download") {
      try {
        await downloadDocument(item.id, item.originalFilename);
      } catch (error) {
        console.error("Download failed:", error);
        dialog.alert({
          message: "다운로드에 실패했습니다. 다시 시도해주세요.",
          variant: "error",
        });
      }
    } else if (type === "delete") {
      if (!canManage) {
        dialog.alert({
          title: "권한 없음",
          message: "문서를 삭제할 권한이 없습니다.",
          variant: "warning",
        });
        return;
      }

      const confirmed = await dialog.confirm({
        title: "문서 삭제",
        message: `[${item.originalFilename}] 문서를 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
        variant: "error",
      });

      if (confirmed) {
        deleteMutation.mutate(item.id);
      }
    }
  };

  const handleBulkDownload = async () => {
    if (selectedDocs.length === 0) return;

    const confirmed = await dialog.confirm({
      title: "일괄 다운로드",
      message: `선택된 문서 ${selectedDocs.length}개를 다운로드 합니다.\n파일 개수에 따라 시간이 소요될 수 있습니다.`,
      variant: "info",
    });

    if (confirmed) {
      const results = await executeBulkDownload(selectedDocs);
      const fulfilledCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const rejectedCount = results.length - fulfilledCount;

      let message = `일괄 다운로드가 완료되었습니다.`;
      if (rejectedCount > 0) {
        message = `⚠️ ${fulfilledCount}건 다운로드 시작, ${rejectedCount}건 실패했습니다.`;
      }

      dialog.alert({
        title: "다운로드 요청 완료",
        message: message,
        variant: rejectedCount > 0 ? "warning" : "success",
      });

      setSelectedItemIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIdsArray.length === 0) return;
    if (!canManage) {
      dialog.alert({
        title: "권한 없음",
        message: "삭제 권한이 없습니다.",
        variant: "warning",
      });
      return;
    }

    const confirmed = await dialog.confirm({
      title: "일괄 삭제",
      message: `선택된 문서 ${selectedIdsArray.length}개를 정말로 삭제하시겠습니까?\n개별 요청으로 처리되며, 일부 요청이 실패할 수 있습니다.`,
      variant: "error",
    });

    if (confirmed) {
      bulkDeleteMutation.mutate(selectedIdsArray);
    }
  };

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

  const handleTitleClick = (item: Document) => {
    setSelectedDocument(item);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedDocument(null);
    setIsModalOpen(false);
  };

  const isDeleting = bulkDeleteMutation.isPending || deleteMutation.isPending;

  const projectOptions = useMemo(() => {
    const deptProjects = projects.filter(
      (p) => p.departmentId === selectedDeptId
    );
    const options = deptProjects.map((p) => ({
      value: String(p.id),
      label: p.name,
    }));

    return [{ value: "ALL", label: "전체 프로젝트" }, ...options];
  }, [projects, selectedDeptId]);

  return (
    <div className="w-full h-full flex flex-col rounded-lg bg-white shadow-sm">
      <div className="flex-none p-2">
        <TableControls
          searchText={searchText}
          onSearchChange={setSearchText}
          projectFilter={projectFilter}
          onProjectFilterChange={setProjectFilter}
          projectOptions={projectOptions}
          statusFilter={statusFilter}
          onStatusFilterChange={(value) =>
            setStatusFilter(value as FilterStatus)
          }
          statusOptions={STATUS_FILTERS}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={(value) =>
            setCategoryFilter(value as FilterCategory)
          }
          categoryOptions={CATEGORY_FILTERS}
          hasSelection={hasSelection}
          onBulkDownload={handleBulkDownload}
          onBulkDelete={canManage ? handleBulkDelete : undefined}
        />
      </div>

      <header className="flex-none flex items-center bg-gray-100 text-xs text-gray-700 font-semibold uppercase tracking-wider p-3 border-y border-gray-200">
        <div className="w-1/12 text-center">
          <input
            type="checkbox"
            className="form-checkbox w-4 h-4 text-blue-600 rounded border-gray-300  focus:ring-blue-500 cursor-pointer"
            checked={isAllSelected}
            onChange={handleSelectAll}
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
        {isLoading || isDeleting ? (
          <div className="text-center p-12 text-gray-500">
            {isDeleting
              ? "선택된 문서를 처리 중입니다..."
              : "데이터를 불러오는 중입니다..."}
          </div>
        ) : (
          <>
            {currentTableData.length > 0 ? (
              <TableBody
                data={currentTableData}
                departments={departments}
                projects={projects}
                onAction={handleAction}
                selectedItemIds={selectedItemIds}
                onCheckboxChange={handleCheckboxChange}
                canManage={canManage}
                onTitleClick={handleTitleClick}
              />
            ) : (
              <div className="text-center p-8 text-gray-500">
                {/* [수정] 안내 메시지 로직: 필터가 비어있으면(선택안함) 안내 메시지 표시 */}
                {!projectFilter
                  ? "프로젝트를 선택하여 문서를 조회해주세요."
                  : documents.length === 0
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
        document={selectedDocument}
        onClose={handleModalClose}
        open={isModalOpen}
      />
    </div>
  );
}
