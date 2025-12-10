// src/pages/admin/UserCreateModal.tsx

import { useState } from "react";
import { X, Save, UserPlus } from "lucide-react";
import type { Department } from "@/types/UserType";
import type { CreateUserRequest } from "@/services/user.service";

interface UserCreateModalProps {
  departments: Department[];
  onSave: (data: CreateUserRequest) => Promise<void>;
  onClose: () => void;
}

export default function UserCreateModal({
  departments,
  onSave,
  onClose,
}: UserCreateModalProps) {
  // 폼 상태
  const [formData, setFormData] = useState<CreateUserRequest>({
    account_id: "",
    password: "",
    user_name: "",
    dept_id: 0,
    role: "USER", // 기본값
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "dept_id" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.account_id || !formData.password || !formData.user_name) {
      alert("모든 필수 정보를 입력해주세요.");
      return;
    }
    if (formData.dept_id === 0) {
      alert("부서를 선택해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error(error);
      alert("사용자 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" />
            신규 사용자 등록
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 아이디 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              아이디 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="account_id"
              value={formData.account_id}
              onChange={handleChange}
              placeholder="로그인 아이디 입력"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="초기 비밀번호 입력"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="user_name"
              value={formData.user_name}
              onChange={handleChange}
              placeholder="사용자 실명 입력"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 부서 선택 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                부서 <span className="text-red-500">*</span>
              </label>
              <select
                name="dept_id"
                value={formData.dept_id}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white"
              >
                <option value={0}>선택 안함</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.dept_name}
                  </option>
                ))}
              </select>
            </div>

            {/* 권한 선택 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                권한
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white"
              >
                <option value="USER">일반 사용자</option>
                <option value="MANAGER">부서 관리자</option>
              </select>
            </div>
          </div>

          {/* 버튼 */}
          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              <Save size={16} />
              {isSubmitting ? "등록 중..." : "등록 완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
