// Pagination.tsx
import type { FC } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void; // 페이지 변경 시 호출되는 함수의 타입
}

// 함수 컴포넌트(FC)에 PaginationProps 타입을 적용
const Pagination: FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pageNumbers: number[] = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  );

  // page 인수에 number 타입을 명시
  const handlePageClick = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex justify-center items-center py-1 space-x-2">
      {/* ◀ 이전 버튼 */}
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50"
      >
        <ChevronLeft size={20} />
      </button>

      {/* 페이지 번호들 */}
      {pageNumbers.map(
        (
          page: number // map 내부의 page에도 타입 명시
        ) => (
          <button
            key={page}
            onClick={() => handlePageClick(page)}
            className={`px-3 py-1 rounded-lg text-sm transition-colors 
            ${
              page === currentPage
                ? "bg-blue-600 text-white font-bold"
                : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* ▶ 다음 버튼 */}
      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default Pagination;
