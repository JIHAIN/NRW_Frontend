// src/pages/admin/components/UserEditModal.tsx
import React, { useState, type FC } from "react";
import type { Department, Project, User, UserRole } from "@/types/UserType";

interface UserEditModalProps {
  user: User;
  roles: UserRole[];
  departments: Department[];
  projects: Project[];
  onSave: (updatedUser: User) => void;
  onClose: () => void;
}

const UserEditModal: FC<UserEditModalProps> = ({
  user,
  roles,
  departments,
  projects,
  onSave,
  onClose,
}) => {
  // 모달 내에서 편집 중인 상태
  const [editingUser, setEditingUser] = useState<User>(user);

  // 현재 선택된 권한에 따라 편집 필드 구조가 달라져야 합니다.
  const isDeptAdmin = editingUser.role === "관리자";
  const isRegularUser = editingUser.role === "일반 사용자";

  // 권한 변경 핸들러
  const handleRoleChange = (newRole: UserRole) => {
    // 권한이 변경될 때 관련된 부서/프로젝트 상태를 초기화합니다.
    setEditingUser({
      ...editingUser,
      role: newRole,
      managedDepartmentIds: [], // 관리자 권한 변경 시 초기화
      departmentId: departments[0]?.id || 0, // 일반 사용자 권한 변경 시 기본값 설정
      projectIds: [], // 프로젝트 목록 초기화
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegularUser && !editingUser.departmentId) {
      alert("일반 사용자는 소속 부서가 반드시 지정되어야 합니다.");
      return;
    }
    // API에 저장 요청 후 성공 시 onSave 호출
    onSave(editingUser);
  };

  return (
    // 모달 배경 (border-2xl border-blue-100 스타일 적용)
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg border-2xl border-blue-100">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">
          사용자 권한 및 배정 설정: {user.name}
        </h3>

        <form onSubmit={handleSave}>
          {/* 1. 권한 설정 드롭다운 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              권한 (Role)
            </label>
            <select
              value={editingUser.role}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className="w-full border rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* 2. 부서 관리자 설정 필드 */}
          {isDeptAdmin && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                관리할 부서 선택 (다중 선택 가능)
              </label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {departments.map((dept) => (
                  <div key={dept.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`dept-${dept.id}`}
                      checked={editingUser.managedDepartmentIds.includes(
                        dept.id
                      )}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...editingUser.managedDepartmentIds, dept.id]
                          : editingUser.managedDepartmentIds.filter(
                              (id) => id !== dept.id
                            );
                        setEditingUser({
                          ...editingUser,
                          managedDepartmentIds: newIds,
                        });
                      }}
                      className="form-checkbox text-blue-600 rounded cursor-pointer"
                    />
                    <label
                      htmlFor={`dept-${dept.id}`}
                      className="ml-2 text-sm text-gray-600 cursor-pointer"
                    >
                      {dept.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. 일반 사용자 소속 설정 필드 (부서 + 프로젝트) */}
          {isRegularUser && (
            <div className="mb-4 p-3 bg-green-50 rounded-md">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                소속 부서 및 프로젝트 배정
              </label>

              {/* 소속 부서 (하나만 선택) */}
              <select
                value={editingUser.departmentId || ""}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    departmentId: Number(e.target.value),
                  })
                }
                className="w-full border rounded-md p-2 mb-3 focus:ring-green-500 focus:border-green-500 cursor-pointer"
              >
                <option value="" disabled>
                  소속 부서 선택
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>

              {/* 소속 프로젝트 (다중 선택 가능) */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  참여 프로젝트
                </label>
                <div className="max-h-24 overflow-y-auto space-y-1 border p-2 bg-white rounded-md">
                  {projects
                    .filter((p) => p.departmentId === editingUser.departmentId) // 선택된 부서의 프로젝트만 필터링
                    .map((proj) => (
                      <div key={proj.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`proj-${proj.id}`}
                          checked={editingUser.projectIds.includes(proj.id)}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...editingUser.projectIds, proj.id]
                              : editingUser.projectIds.filter(
                                  (id) => id !== proj.id
                                );
                            setEditingUser({
                              ...editingUser,
                              projectIds: newIds,
                            });
                          }}
                          className="form-checkbox text-green-600 rounded cursor-pointer"
                        />
                        <label
                          htmlFor={`proj-${proj.id}`}
                          className="ml-2 text-sm text-gray-600 cursor-pointer"
                        >
                          {proj.name}
                        </label>
                      </div>
                    ))}
                  {editingUser.departmentId &&
                    projects.filter(
                      (p) => p.departmentId === editingUser.departmentId
                    ).length === 0 && (
                      <p className="text-xs text-gray-400">
                        선택된 부서에 프로젝트가 없습니다.
                      </p>
                    )}
                  {!editingUser.departmentId && (
                    <p className="text-xs text-gray-400">
                      소속 부서를 먼저 선택해주세요.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. 액션 버튼 */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
            >
              설정 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;
