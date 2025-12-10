import type { FC } from "react";
import { Download, Trash2, FileText } from "lucide-react";
import type { Document } from "@/types/UserType";

// 상수 파일 임포트
import {
  STATUS_CONFIG,
  CATEGORY_LABEL,
  CATEGORY_COLOR,
} from "@/constants/projectConstants";

export interface TableBodyProps {
  data: Document[];
  onAction: (type: "download" | "delete", item: Document) => void;
  selectedItemIds: Set<number>;
  onCheckboxChange: (itemId: number, isChecked: boolean) => void;
  canManage: boolean;
  onTitleClick: (item: Document) => void; //  [추가] 클릭 핸들러 타입 정의
}

const TableBody: FC<TableBodyProps> = ({
  data,
  onAction,
  selectedItemIds,
  onCheckboxChange,
  canManage,
  onTitleClick, //  [추가] 핸들러 받기
}) => {
  return (
    <div className="bg-white divide-y divide-gray-100">
      {data.map((item: Document) => {
        // 상수 파일에서 설정 가져오기
        const statusConfig =
          STATUS_CONFIG[item.status] || STATUS_CONFIG["PARSED"];
        const categoryLabel = CATEGORY_LABEL[item.category] || item.category;
        const categoryStyle =
          CATEGORY_COLOR[item.category] || CATEGORY_COLOR["GENERAL"];

        return (
          <div
            key={item.id}
            className="flex items-center text-sm text-gray-700  border-gray-200 hover:bg-blue-50/50 transition-colors p-3 group"
          >
            {/* 1. 체크박스 */}
            <div className="w-1/12 text-center">
              <input
                type="checkbox"
                className="form-checkbox w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                checked={selectedItemIds.has(item.id)}
                onChange={(e) => onCheckboxChange(item.id, e.target.checked)}
              />
            </div>

            {/* 2. 문서 이름 */}
            <div className="w-3/12 flex items-center gap-2 overflow-hidden">
              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex flex-col overflow-hidden">
                <span
                  onClick={() => onTitleClick(item)} //  [추가] 클릭 이벤트 연결
                  className="truncate font-medium text-gray-900 cursor-pointer hover:text-blue-600 hover:underline decoration-blue-600 underline-offset-2"
                  title={item.originalFilename}
                >
                  {item.originalFilename}
                </span>
                {/* 파일 경로를 이름 아래에 작게 표시 */}
                <span
                  className="text-[10px] text-gray-400 truncate"
                  title={item.storedPath}
                >
                  {item.storedPath}
                </span>
              </div>
            </div>

            {/* 3. 분류 (카테고리) */}
            <div className="w-2/12">
              <span
                className={`px-2.5 py-0.5 rounded border text-xs font-medium ${categoryStyle}`}
              >
                {categoryLabel}
              </span>
            </div>

            {/* 4. 생성 일자 */}
            <div className="w-[10%] text-xs text-gray-500">
              {item.createdAt.split("T")[0]}
            </div>

            {/* 5. 상태 */}
            <div className="w-[10%] flex items-center">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig.dot}`}
                ></span>
                {statusConfig.label}
              </span>
            </div>

            {/* 6. 업데이트 일자 */}
            <div className="w-[10%] text-xs text-gray-500">
              {item.updatedAt.split("T")[0]}
            </div>

            {/* 7. 관리 버튼 */}
            <div className="w-2/12 flex justify-center items-center gap-2  transition-opacity">
              <button
                onClick={() => onAction("download", item)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
              >
                <Download size={16} />
              </button>
              {canManage && (
                <button
                  onClick={() => onAction("delete", item)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TableBody;
