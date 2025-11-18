import { useState, useMemo, type FC, useEffect } from "react";
import { Trash2, Settings, Search } from "lucide-react";
import UserEditModal from "./UserEditModal";
import type { User, UserRole } from "@/types/UserType";

// ✨ Store 임포트
import { useSystemStore } from "@/store/systemStore";
import { useUserStore } from "@/store/userStore";

import Pagination from "../project/components/Pagination";
import { FilterCombobox } from "@/components/common/FilterCombobox";

// --------------------------------------------------------------------------
// 💡 상수 및 헬퍼 정의
// --------------------------------------------------------------------------

const ITEMS_PER_PAGE: number = 10;

// UI 표시용 Role 라벨 맵핑
const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "총괄 관리자",
  MANAGER: "관리자",
  USER: "일반 사용자",
};

// Role별 뱃지 색상 맵핑
const ROLE_COLOR_MAP: Record<UserRole, { bg: string; text: string }> = {
  SUPER_ADMIN: { bg: "bg-red-100", text: "text-red-700" },
  MANAGER: { bg: "bg-yellow-100", text: "text-yellow-700" },
  USER: { bg: "bg-blue-100", text: "text-blue-500" },
};

// 필터 옵션용 Interface
interface OptionItem<T> {
  value: T;
  label: string;
}

// 권한 필터 옵션 생성 (검색 필터용 - 전체 포함)
const ROLE_FILTER_OPTIONS: OptionItem<string>[] = [
  { value: "ALL", label: "전체 권한" },
  { value: "SUPER_ADMIN", label: "총괄 관리자" },
  { value: "MANAGER", label: "관리자" },
  { value: "USER", label: "일반 사용자" },
];

// ✨ 수정 모달용 권한 목록 (전체 제외)
const EDIT_ROLES: OptionItem<string>[] = [
  { value: "SUPER_ADMIN", label: "총괄 관리자" },
  { value: "MANAGER", label: "관리자" },
  { value: "USER", label: "일반 사용자" },
];

// --------------------------------------------------------------------------
// 💡 삭제 확인 모달
// --------------------------------------------------------------------------
interface DeleteConfirmModalProps {
  userName: string;
  onConfirm: () => void;
  onClose: () => void;
}
const DeleteConfirmModal: FC<DeleteConfirmModalProps> = ({
  userName,
  onConfirm,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-80 relative">
        <h3 className="text-lg font-bold mb-4 text-gray-800">
          사용자 삭제 확인
        </h3>
        <p className="mb-6 text-sm text-gray-600">
          <span className="font-semibold text-red-600">{userName}</span> 님을
          삭제하시겠습니까?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------
// ✨ 메인 컴포넌트
// --------------------------------------------------------------------------

export const UserManagementPage: FC = () => {
  // ✨ 1. Store 구독 (projects 추가)
  const { departments, projects, fetchSystemData } = useSystemStore();
  const { users, fetchUsers, deleteUser, updateUser } = useUserStore();

  // ✨ 2. 초기 데이터 로드
  useEffect(() => {
    fetchSystemData();
    fetchUsers();
  }, [fetchSystemData, fetchUsers]);

  // ✨ 3. 부서 필터 옵션 생성
  const deptOptions: OptionItem<string>[] = useMemo(() => {
    return [
      { value: "ALL", label: "전체 부서" },
      ...departments.map((dept) => ({ value: dept.name, label: dept.name })),
    ];
  }, [departments]);

  // 상태 관리
  const [searchText, setSearchText] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // --------------------------------------------------------------------------
  // 🔍 필터링 로직
  // --------------------------------------------------------------------------
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 1. 권한 필터
      if (roleFilter !== "ALL" && user.role !== roleFilter) {
        return false;
      }

      // 2. 부서 필터
      if (deptFilter !== "ALL") {
        const userDeptName = departments.find(
          (dept) => dept.id === user.departmentId
        )?.name;
        if (userDeptName !== deptFilter) {
          return false;
        }
      }

      // 3. 검색 필터
      const searchLower = searchText.toLowerCase();
      const userName = user.userName.toLowerCase();
      const accountId = user.accountId.toLowerCase();

      if (!userName.includes(searchLower) && !accountId.includes(searchLower)) {
        return false;
      }

      return true;
    });
  }, [users, searchText, roleFilter, deptFilter, departments]);

  // --------------------------------------------------------------------------
  // 📄 페이지네이션 계산
  // --------------------------------------------------------------------------
  const totalItems: number = filteredUsers.length;
  const totalPages: number = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const currentTableData: User[] = useMemo(() => {
    const firstPageIndex: number = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex: number = firstPageIndex + ITEMS_PER_PAGE;
    return filteredUsers.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, roleFilter, deptFilter]);

  // --------------------------------------------------------------------------
  // ✋ 핸들러 함수
  // --------------------------------------------------------------------------
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete.id);
    setUserToDelete(null);
    if (currentTableData.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSaveUser = (updatedUser: User) => {
    updateUser(updatedUser);
    setIsEditModalOpen(false);
  };

  const handleRoleChange = (value: string) => setRoleFilter(value);
  const handleDeptChange = (value: string) => setDeptFilter(value);

  return (
    <div className="flex flex-col gap-4 page-layout">
      <h1 className="page-title"> 사용자 관리 </h1>

      {/* 검색 및 필터 영역 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* 검색창 */}
          <div className="flex items-center border border-blue-100 rounded-2xl p-1 bg-white w-80 min-w-100">
            <Search size={20} className="text-blue-400 mx-2" />
            <input
              type="text"
              placeholder="이름 또는 아이디 검색"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full p-1 focus:outline-none"
            />
          </div>

          {/* 권한 필터 */}
          <FilterCombobox<string>
            options={ROLE_FILTER_OPTIONS}
            selectedValue={roleFilter}
            onValueChange={handleRoleChange}
            placeholder={"권한 필터"}
          />

          {/* 부서 필터 */}
          <FilterCombobox<string>
            options={deptOptions}
            selectedValue={deptFilter}
            onValueChange={handleDeptChange}
            placeholder={"부서 필터"}
          />
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-lg border-2xl border-blue-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="w-3/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이름 / 아이디
              </th>
              <th className="w-2/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                권한
              </th>
              <th className="w-3/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                소속 부서
              </th>
              <th className="w-1/12 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentTableData.length > 0 ? (
              currentTableData.map((user) => {
                const roleStyle = ROLE_COLOR_MAP[user.role] || {
                  bg: "bg-gray-100",
                  text: "text-gray-500",
                };
                const roleLabel = ROLE_LABELS[user.role] || user.role;
                const deptName =
                  departments.find((d) => d.id === user.departmentId)?.name ||
                  "-";

                return (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{user.userName}</div>
                      <div className="text-xs text-gray-500">
                        {user.accountId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`p-1 text-xs rounded font-semibold ${roleStyle.bg} ${roleStyle.text}`}
                      >
                        {roleLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deptName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 cursor-pointer p-1"
                      >
                        <Settings size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-600 hover:text-red-900 cursor-pointer p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  사용자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* ✨ 사용자 수정 모달 (속성 전달 수정됨) */}
      {isEditModalOpen && selectedUser && (
        <UserEditModal
          user={selectedUser}
          roles={EDIT_ROLES} // ✨ roles 전달
          departments={departments} // ✨ departments 전달
          projects={projects} // ✨ projects 전달
          onSave={handleSaveUser}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* 삭제 확인 모달 */}
      {userToDelete && (
        <DeleteConfirmModal
          userName={userToDelete.userName}
          onConfirm={handleConfirmDelete}
          onClose={() => setUserToDelete(null)}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
