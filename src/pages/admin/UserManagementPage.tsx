// src/pages/admin/UserManagementPage.tsx

import { useState, useMemo, type FC, useEffect } from "react";
import { Trash2, Settings, Search, X } from "lucide-react";
import UserEditModal from "./UserEditModal";
// 타입은 @/types/UserType 에서 가져온다고 가정
import type { User, UserRole } from "@/types/UserType";
import {
  DUMMY_USERS,
  DUMMY_DEPARTMENTS,
  DUMMY_PROJECTS,
} from "../../types/dummy_data";
// Pagination 컴포넌트 임포트 (경로 확인)
import Pagination from "../project/components/Pagination";
import { FilterCombobox } from "@/components/common/FilterCombobox";

// FilterCombobox에서 사용될 OptionItem 타입 (string 값으로 사용)
interface OptionItem<T> {
  value: T;
  label: string;
}

// -----------------------------------------------------------------
// ✨ 1. 상수 및 헬퍼 정의
// -----------------------------------------------------------------

const ITEMS_PER_PAGE: number = 10;
const ROLES: UserRole[] = ["총괄 관리자", "관리자", "일반 사용자"];

// 💡 권한 옵션 (FilterCombobox OptionItem<string> 형식)
const ROLE_OPTIONS: OptionItem<string>[] = [
  { value: "전체 권한", label: "전체 권한" },
  ...ROLES.map((role) => ({ value: role, label: role })),
];

// 💡 부서 옵션 (FilterCombobox OptionItem<string> 형식, 이름 기준)
const DEPT_OPTIONS: OptionItem<string>[] = [
  { value: "전체 부서", label: "전체 부서" },
  ...DUMMY_DEPARTMENTS.map((dept) => ({ value: dept.name, label: dept.name })),
];

// 💡 권한별 색상 매핑 (UX 개선)
const ROLE_COLOR_MAP: Record<UserRole, { bg: string; text: string }> = {
  "총괄 관리자": { bg: "bg-red-100", text: "text-red-700" },
  관리자: { bg: "bg-yellow-100", text: "text-yellow-700" },
  "일반 사용자": { bg: "bg-blue-100", text: "text-blue-500" },
};

// -----------------------------------------------------------------
// ✨ 2. 사용자 삭제 확인 모달 (UX 개선)
// -----------------------------------------------------------------
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
  // 배경을 클릭해도 닫히지 않도록 이벤트 버블링 방지
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-80 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold mb-4 text-gray-800">
          사용자 삭제 확인
        </h3>
        <p className="mb-6 text-sm text-gray-600">
          정말로 <span className="font-semibold text-red-600">{userName}</span>{" "}
          님을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------
// ✨ 3. 메인 컴포넌트: UserManagementPage
// -----------------------------------------------------------------

export const UserManagementPage: FC = () => {
  // 1. 상태 관리
  const [users, setUsers] = useState<User[]>(DUMMY_USERS);
  const [searchText, setSearchText] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 💡 필터 상태 추가
  const [roleFilter, setRoleFilter] = useState<string>("전체 권한");
  const [deptFilter, setDeptFilter] = useState<string>("전체 부서");

  // 💡 페이지네이션 및 삭제 모달 상태
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // 2. 검색 및 필터링 로직 (useMemo 활용)
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 💡 1. 권한 필터
      // 타입 캐스팅 없이 string으로 비교
      if (roleFilter !== "전체 권한" && user.role !== roleFilter) {
        return false;
      }

      // 💡 2. 부서 필터
      if (deptFilter !== "전체 부서") {
        const userDeptName = DUMMY_DEPARTMENTS.find(
          (dept) => dept.id === user.departmentId
        )?.name;
        if (userDeptName !== deptFilter) {
          return false;
        }
      }

      // 💡 3. 검색 필터
      const searchLower = searchText.toLowerCase();
      if (
        !user.name.toLowerCase().includes(searchLower) &&
        !user.email.toLowerCase().includes(searchLower)
      ) {
        return false;
      }

      return true;
    });
  }, [users, searchText, roleFilter, deptFilter]);

  // 3. 페이지네이션 계산
  const totalItems: number = filteredUsers.length;
  const totalPages: number = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // 4. 현재 페이지 데이터 슬라이싱
  const currentTableData: User[] = useMemo(() => {
    const firstPageIndex: number = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex: number = firstPageIndex + ITEMS_PER_PAGE;
    return filteredUsers.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredUsers]);

  // 5. 필터/검색 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, roleFilter, deptFilter]);

  // 6. 핸들러 함수
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  // 💡 권한 필터 변경 핸들러
  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
  };

  // 💡 부서 필터 변경 핸들러
  const handleDeptChange = (value: string) => {
    setDeptFilter(value);
  };

  // 💡 삭제 버튼 클릭 시 모달 열기
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  // 💡 모달에서 삭제 확정 시 실행
  const handleConfirmDelete = () => {
    if (!userToDelete) return;

    console.log(`사용자 ID ${userToDelete.id} 삭제 요청`);
    setUsers(users.filter((u) => u.id !== userToDelete.id));
    setUserToDelete(null); // 모달 닫기

    // 삭제 후 현재 페이지의 사용자가 없으면 페이지를 뒤로 이동
    if (currentTableData.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSaveUser = (updatedUser: User) => {
    console.log("사용자 정보 저장:", updatedUser);
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setIsEditModalOpen(false);
  };

  // 7. 컴포넌트 렌더링
  return (
    <div className="flex flex-col gap-4 page-layout">
      <h1 className="page-title"> 사용자 관리 </h1>
      {/* 🔍 검색, 필터 및 액션 버튼 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* 검색창 */}
          <div className="flex items-center border border-blue-100 rounded-2xl p-1 bg-white w-80 min-w-100">
            <Search size={20} className="text-blue-400 mx-2" />
            <input
              type="text"
              placeholder="사용자 이름 또는 이메일 검색"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full p-1 focus:outline-none "
            />
          </div>

          {/* 💡 권한 필터 드롭다운 */}
          {/* <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-2 border border-blue-100 rounded-md bg-white text-sm  focus:outline-none cursor-pointer"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select> */}

          {/* 💡 소속 부서 필터 드롭다운 */}
          {/* <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="p-2 border border-blue-100 rounded-md bg-white text-sm  focus:outline-none cursor-pointer"
          >
            {DEPT_OPTIONS.map((deptName) => (
              <option key={deptName} value={deptName}>
                {deptName}
              </option>
            ))}
          </select> */}

          {/* 💡 권한 필터 드롭다운 (FilterCombobox 사용) */}
          <FilterCombobox<string>
            options={ROLE_OPTIONS}
            selectedValue={roleFilter}
            onValueChange={handleRoleChange}
            placeholder={"권한 필터"}
            className=""
          />

          {/* 💡 소속 부서 필터 드롭다운 (FilterCombobox 사용) */}
          <FilterCombobox<string>
            options={DEPT_OPTIONS}
            selectedValue={deptFilter}
            onValueChange={handleDeptChange}
            placeholder={"부서 필터"}
            className=""
          />
        </div>
      </div>

      {/* 📋 사용자 목록 테이블 */}
      <div className="overflow-x-auto  bg-white rounded-lg shadow-lg border-2xl border-blue-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="w-3/12 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이름
              </th>
              <th className="w-3/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                권한
              </th>
              <th className="w-3/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                소속 부서
              </th>
              <th className="w-1/12  py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                return (
                  <tr key={user.id}>
                    {/* 1. 이름 */}
                    <td className="px-6  whitespace-nowrap text-sm text-gray-900">
                      {user.name}
                      <span className="block text-xs text-gray-500">
                        {user.email}
                      </span>
                    </td>

                    {/* 2. 권한 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`p-1 text-xs rounded font-semibold ${roleStyle.bg} ${roleStyle.text}`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* 3. 소속 부서 */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {DUMMY_DEPARTMENTS.find(
                        (dept) => dept.id === user.departmentId
                      )?.name || "N/A"}
                    </td>

                    {/* 4. 관리 버튼 */}
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
                  {searchText ||
                  roleFilter !== "전체 권한" ||
                  deptFilter !== "전체 부서"
                    ? "검색/필터 결과에 해당하는 사용자가 없습니다."
                    : "등록된 사용자가 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 💡 페이지네이션 컴포넌트 추가 */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* ⚙️ 사용자 편집/권한 설정 모달 */}
      {isEditModalOpen && selectedUser && (
        <UserEditModal
          user={selectedUser}
          roles={ROLES}
          departments={DUMMY_DEPARTMENTS}
          projects={DUMMY_PROJECTS}
          onSave={handleSaveUser}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* 💡 삭제 확인 모달 */}
      {userToDelete && (
        <DeleteConfirmModal
          userName={userToDelete.name}
          onConfirm={handleConfirmDelete}
          onClose={() => setUserToDelete(null)}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
