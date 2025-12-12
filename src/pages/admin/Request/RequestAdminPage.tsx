import { useState, useMemo, type FC, useEffect } from "react";
import { Trash2, Settings, Search, Plus } from "lucide-react";

import type { User, UserRole } from "@/types/UserType";
import { useAuthStore } from "@/store/authStore";

import type { CreateUserRequest } from "@/services/user.service";

import { useSystemStore } from "@/store/systemStore";
import { useUserStore } from "@/store/userStore";

import { FilterCombobox } from "@/components/common/FilterCombobox";
import { useDialogStore } from "@/store/dialogStore";
import Pagination from "@/pages/project/components/Pagination";
import UserEditModal from "../UserModal/UserEditModal";
import UserCreateModal from "../UserModal/UserCreateModal";

const ITEMS_PER_PAGE: number = 10;

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "총괄 관리자",
  MANAGER: "관리자",
  USER: "일반 사용자",
};

const ROLE_COLOR_MAP: Record<UserRole, { bg: string; text: string }> = {
  SUPER_ADMIN: { bg: "bg-red-100", text: "text-red-700" },
  MANAGER: { bg: "bg-yellow-100", text: "text-yellow-700" },
  USER: { bg: "bg-blue-100", text: "text-blue-500" },
};

interface OptionItem<T> {
  value: T;
  label: string;
}

const ROLE_FILTER_OPTIONS: OptionItem<string>[] = [
  { value: "ALL", label: "전체 권한" },
  { value: "MANAGER", label: "관리자" },
  { value: "USER", label: "일반 사용자" },
];

// 삭제 확인 모달
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

export const UserManagementPage: FC = () => {
  const { departments, projects, fetchSystemData } = useSystemStore();
  const { users, fetchUsers, deleteUser, updateUser, addUser } = useUserStore();
  const { user: currentUser } = useAuthStore();

  const dialog = useDialogStore();

  useEffect(() => {
    fetchSystemData();
    fetchUsers();
  }, [fetchSystemData, fetchUsers]);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isManager = currentUser?.role === "MANAGER";

  const deptOptions: OptionItem<string>[] = useMemo(() => {
    return [
      { value: "ALL", label: "전체 부서" },
      ...departments.map((dept) => ({
        value: dept.dept_name,
        label: dept.dept_name,
      })),
    ];
  }, [departments]);

  const [searchText, setSearchText] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");

  const [currentPage, setCurrentPage] = useState<number>(1);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (user.role === "SUPER_ADMIN") return false;
      if (isManager) {
        if (user.departmentId !== currentUser?.departmentId) return false;
      }
      if (roleFilter !== "ALL" && user.role !== roleFilter) return false;
      if (deptFilter !== "ALL") {
        const userDeptName = departments.find(
          (dept) => dept.id === user.departmentId
        )?.dept_name;
        if (userDeptName !== deptFilter) return false;
      }
      const searchLower = searchText.toLowerCase();
      const userName = user.userName.toLowerCase();
      const employeeId = user.employeeId?.toLowerCase() || "";
      const accountId = user.accountId.toLowerCase();

      if (
        !userName.includes(searchLower) &&
        !accountId.includes(searchLower) &&
        !employeeId.includes(searchLower)
      ) {
        return false;
      }
      return true;
    });
  }, [
    users,
    searchText,
    roleFilter,
    deptFilter,
    departments,
    currentUser,
    isManager,
  ]);

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

  // [수정] 이미지가 없으므로 단순 업데이트만 수행
  const handleSaveUser = async (updatedUser: User) => {
    try {
      await updateUser(updatedUser);
      dialog.alert({
        title: "수정 완료",
        message: "사용자 정보가 수정되었습니다.",
        variant: "success",
      });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error(error);
      dialog.alert({
        title: "오류 발생",
        message: "정보 수정 중 오류가 발생했습니다.",
        variant: "error",
      });
    }
  };

  const handleCreateUser = async (data: CreateUserRequest) => {
    try {
      await addUser(data);
      dialog.alert({
        title: "생성 완료",
        message: "새로운 사용자가 등록되었습니다.",
        variant: "success",
      });
      setIsCreateModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleChange = (value: string) => setRoleFilter(value);
  const handleDeptChange = (value: string) => setDeptFilter(value);

  const availableEditRoles: OptionItem<string>[] = useMemo(() => {
    if (isSuperAdmin) {
      return [
        { value: "MANAGER", label: "관리자" },
        { value: "USER", label: "일반 사용자" },
      ];
    }
    return [{ value: "USER", label: "일반 사용자" }];
  }, [isSuperAdmin]);

  return (
    <div className="flex flex-col gap-4 page-layout">
      <h1 className="page-title"> 사용자 관리 </h1>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-blue-100 rounded-2xl p-1 bg-white w-80 min-w-100">
            <Search size={20} className="text-blue-400 mx-2" />
            <input
              type="text"
              placeholder="이름 또는 사원번호 검색"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full p-1 focus:outline-none"
            />
          </div>

          {isSuperAdmin && (
            <>
              <FilterCombobox<string>
                options={ROLE_FILTER_OPTIONS}
                selectedValue={roleFilter}
                onValueChange={handleRoleChange}
                placeholder={"권한 필터"}
              />
              <FilterCombobox<string>
                options={deptOptions}
                selectedValue={deptFilter}
                onValueChange={handleDeptChange}
                placeholder={"부서 필터"}
              />
            </>
          )}
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={18} />
            사용자 등록
          </button>
        )}
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-lg border-2xl border-blue-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="w-3/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이름 / 사원번호
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
                  departments.find((d) => d.id === user.departmentId)
                    ?.dept_name || "-";

                let canEdit = false;
                if (isSuperAdmin) {
                  canEdit = true;
                } else if (isManager) {
                  canEdit = user.role === "USER";
                }

                return (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{user.userName}</div>
                      <div className="text-xs text-gray-500">
                        {user.employeeId || user.accountId}
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
                      {canEdit && (
                        <>
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
                        </>
                      )}
                      {!canEdit && (
                        <span className="text-xs text-gray-300">-</span>
                      )}
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

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {isEditModalOpen && selectedUser && (
        <UserEditModal
          user={selectedUser}
          roles={availableEditRoles}
          departments={departments}
          projects={projects}
          currentRole={currentUser?.role}
          onSave={handleSaveUser}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {isCreateModalOpen && (
        <UserCreateModal
          departments={departments}
          onSave={handleCreateUser}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

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
