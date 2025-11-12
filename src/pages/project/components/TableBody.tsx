// TableBody.tsx
import type { FC } from "react";
import { Download, Trash2 } from "lucide-react";
import type { Document } from "../../../types/UserType";

export interface TableBodyProps {
  data: Document[];
  onAction: (type: "download" | "delete", item: Document) => void;
  // ✨ 체크박스 관련 props 추가 ✨
  selectedItemIds: Set<number>;
  onCheckboxChange: (itemId: number, isChecked: boolean) => void;
}

// 함수 컴포넌트(FC)에 TableBodyProps 타입을 적용
const TableBody: FC<TableBodyProps> = ({
  data,
  onAction,
  selectedItemIds,
  onCheckboxChange,
}) => {
  return (
    <div>
      {data.map((item: Document) => (
        <div
          key={item.id}
          className="flex items-center text-sm text-gray-800 border-b border-blue-100 hover:bg-gray-50 p-3"
        >
          {/* ✨ 체크박스 ✨ */}
          <div className="w-1/12 text-center ">
            <input
              type="checkbox"
              className="form-checkbox text-blue-600 rounded"
              checked={selectedItemIds.has(item.id)} // 선택 여부 결정
              onChange={(e) => onCheckboxChange(item.id, e.target.checked)} // 변경 핸들러
            />
          </div>
          {/* 문서 이름 */}
          <div className="w-3/12 truncate font-medium text-blue-600 cursor-pointer">
            {item.name}
          </div>
          {/* 문서 위치 */}
          <div className="w-2/12">{item.location}</div>
          {/* 생성 일자 */}
          <div className="w-[10%]">{item.created}</div>
          {/* 상태 */}
          <div className="w-[10%] flex items-center">
            <span
              className={`h-2 w-2 ${
                item.status === "완료" ? "bg-blue-500" : "bg-yellow-500"
              } rounded-full mr-1`}
            ></span>
            {item.status}
          </div>
          {/* 완료 일자 */}
          <div className="w-[10%]">{item.completed}</div>
          {/* 관리 */}
          <div className="w-2/12 flex justify-center space-x-3 text-gray-500">
            {/* onAction 호출 시 타입에 맞는 문자열 전달 */}
            <button
              onClick={() => onAction("download", item)}
              className="hover:text-blue-500 cursor-pointer"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => onAction("delete", item)}
              className="hover:text-blue-500 cursor-pointer"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TableBody;
