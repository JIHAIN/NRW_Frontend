import React, { useState, useMemo } from "react";
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

// [추가] 다이얼로그 스토어
import { useDialogStore } from "@/store/dialogStore";

const ITEMS_PER_PAGE = 10;

type FilterStatus = DocumentStatus | "ALL";
type FilterCategory = DocumentCategory | "ALL";

interface ProjectTableProps {
  selectedDeptId: number;
  currentUserRole: string;
}

export function ProjectTable({
  selectedDeptId,
  currentUserRole,
}: ProjectTableProps): React.ReactElement {
  const queryClient = useQueryClient();
  const { projects } = useSystemStore();
  const dialog = useDialogStore(); // [추가] 다이얼로그 훅

  const [projectFilter, setProjectFilter] = useState<string>("1");
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

  // 1. 문서 목록 가져오기
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", selectedDeptId, projectFilter],
    queryFn: () => fetchDocuments(selectedDeptId, parseInt(projectFilter)),
    enabled: selectedDeptId > 0 && !!projectFilter,
    select: (data) =>
      data.map((doc) => ({
        ...doc,
        title: doc.originalFilename,
      })),
  });

  // 2. 필터링 로직
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

  // 3. 페이징 데이터
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentTableData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // 4. 전체 선택 로직
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

  // 5. 선택된 ID/문서 배열
  const selectedIdsArray = useMemo(
    () => Array.from(selectedItemIds),
    [selectedItemIds]
  );
  const selectedDocs = useMemo(() => {
    return filteredData.filter((doc) => selectedItemIds.has(doc.id));
  }, [filteredData, selectedItemIds]);

  const hasSelection = selectedItemIds.size > 0;

  // 6. 개별 요청 실행 함수
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

  // 7. Mutations
  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["documents", selectedDeptId, projectFilter],
      });
      setSelectedItemIds(new Set());
      // [수정] 성공 알림 다이얼로그
      dialog.alert({
        title: "삭제 완료",
        message: "문서가 성공적으로 삭제되었습니다.",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error("문서 삭제 오류:", error);
      // [수정] 실패 알림 다이얼로그
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

      // [수정] 결과 알림 다이얼로그
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
      // [수정] 에러 알림 다이얼로그
      dialog.alert({
        title: "오류 발생",
        message: "문서 일괄 삭제 요청 중 오류가 발생했습니다.",
        variant: "error",
      });
    },
  });

  // 8. 핸들러
  const handleAction = async (type: "download" | "delete", item: Document) => {
    if (type === "download") {
      try {
        await downloadDocument(item.id, item.originalFilename);
      } catch (error) {
        console.error("Download failed:", error);
        // [수정] 다운로드 실패 알림
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

      // [수정] 삭제 확인 다이얼로그
      const confirmed = await dialog.confirm({
        title: "문서 삭제",
        message: `[${item.originalFilename}] 문서를 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
        variant: "error", // 빨간색 강조
      });

      if (confirmed) {
        deleteMutation.mutate(item.id);
      }
    }
  };

  const handleBulkDownload = async () => {
    if (selectedDocs.length === 0) return;

    // [수정] 일괄 다운로드 확인 다이얼로그
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

      // [수정] 다운로드 완료 알림
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

    // [수정] 일괄 삭제 확인 다이얼로그
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

  // Projects Option
  const projectOptions = useMemo(() => {
    const deptProjects = projects.filter(
      (p) => p.departmentId === selectedDeptId
    );
    return deptProjects.map((p) => ({
      value: String(p.id),
      label: p.name,
    }));
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
        document={selectedDocument}
        onClose={handleModalClose}
        open={isModalOpen}
      />
    </div>
  );
}
