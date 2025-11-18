import React, { useState } from "react";
import { X } from "lucide-react";
import type { User, UserRole, Department, Project } from "@/types/UserType";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OptionItem {
  value: string;
  label: string;
}

interface UserEditModalProps {
  user: User;
  // OptionItem 배열로 명시 (UserManagementPage와 맞춰야 함)
  roles: OptionItem[];
  departments: Department[];
  projects: Project[];
  onSave: (updatedUser: User) => void;
  onClose: () => void;
}

export default function UserEditModal({
  user,
  roles,
  departments,
  projects,
  onSave,
  onClose,
}: UserEditModalProps) {
  // 상태 초기화 (undefined일 경우 0으로 처리)
  const [formData, setFormData] = useState<User>({
    ...user,
    departmentId: user.departmentId || 0,
    projectId: user.projectId || 0,
  });

  // 부서 선택 시 해당 부서의 프로젝트만 필터링
  const filteredProjects = projects.filter(
    (p) => p.departmentId === formData.departmentId
  );

  // 변경 핸들러 (any 제거, 구체적 타입 명시)
  const handleChange = (
    field: keyof User,
    value: string | number | boolean | UserRole
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">사용자 정보 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름
            </label>
            <Input
              value={formData.userName}
              onChange={(e) => handleChange("userName", e.target.value)}
            />
          </div>

          {/* 2. 아이디 (수정 불가) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              아이디
            </label>
            <Input
              value={formData.accountId}
              onChange={(e) => handleChange("accountId", e.target.value)}
              disabled
              className="bg-gray-100"
            />
          </div>

          {/* 3. 권한 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              권한
            </label>
            <Select
              value={formData.role}
              onValueChange={(val) => handleChange("role", val as UserRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="권한 선택" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. 소속 부서 (관리자/일반사용자용) */}
          {(formData.role === "MANAGER" || formData.role === "USER") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                소속 부서
              </label>
              <Select
                value={String(formData.departmentId || "")}
                onValueChange={(val) => {
                  const deptId = Number(val);
                  // 부서가 바뀌면 프로젝트는 초기화
                  setFormData((prev) => ({
                    ...prev,
                    departmentId: deptId,
                    projectId: 0,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 5. 소속 프로젝트 (일반사용자용) */}
          {formData.role === "USER" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                소속 프로젝트
              </label>
              <Select
                value={String(formData.projectId || "")}
                onValueChange={(val) => handleChange("projectId", Number(val))}
                disabled={!formData.departmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjects.map((proj) => (
                    <SelectItem key={proj.id} value={String(proj.id)}>
                      {proj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose}>
              취소
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              저장
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
