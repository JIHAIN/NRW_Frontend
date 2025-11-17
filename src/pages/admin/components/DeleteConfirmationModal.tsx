// src/pages/manage/components/DeleteConfirmationModal.tsx
import { type FC } from "react";

interface ModalProps {
  projectName: string;
  onConfirm: (keepDocuments: boolean) => void;
  onCancel: () => void;
}

const DeleteConfirmationModal: FC<ModalProps> = ({
  projectName,
  onConfirm,
  onCancel,
}) => {
  return (
    // 모달 배경 (뒷 배경을 어둡게 처리)
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm">
        <h3 className="text-xl font-bold mb-4 text-red-600">
          프로젝트 삭제 확인
        </h3>

        <span className="mb-6 text-red-700">"{projectName}"</span>
        <span>
          을(를) 삭제하시겠습니까? 이 프로젝트에 속한 문서를 어떻게 처리할지
          선택해 주세요.
        </span>
        {/* ⚠️ 보관/삭제 선택 버튼 */}
        <div className="flex flex-col space-y-3 pt-3">
          <button
            onClick={() => onConfirm(true)} // 문서 보관 (true)
            className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors cursor-pointer"
          >
            문서는 보관 하고 프로젝트만 삭제
          </button>
          <button
            onClick={() => onConfirm(false)} // 문서 삭제 (false)
            className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700 transition-colors cursor-pointer"
          >
            문서도 함께 삭제 하고 프로젝트 삭제
          </button>
        </div>

        <button
          onClick={onCancel}
          className="mt-4 w-full border border-blue-100 text-gray-700 p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
        >
          취소
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
