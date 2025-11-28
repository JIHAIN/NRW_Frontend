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

export interface OptionItem {
  value: string;
  label: string;
}

interface UserEditModalProps {
  user: User;
  roles: OptionItem[];
  departments: Department[];
  projects: Project[];
  // 현재 로그인한 사람의 역할 prop 추가 (optional로 처리)
  currentRole?: UserRole;
  onSave: (updatedUser: User) => void;
  onClose: () => void;
}

export default function UserEditModal({
  user,
  roles,
  departments,
  projects,
  currentRole, // prop 받기
  onSave,
  onClose,
}: UserEditModalProps) {
  const [formData, setFormData] = useState<User>({
    ...user,
    departmentId: user.departmentId || 0,
    projectId: user.projectId || 0,
  });

  const filteredProjects = projects.filter(
    (p) => p.departmentId === formData.departmentId
  );

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

  // ✨ MANAGER인지 확인 (부서 수정 잠금을 위함)
  const isManager = currentRole === "MANAGER";

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
        {/* ... (헤더 부분 동일) ... */}
        <div className="flex justify-between items-center py-2 px-4 border-b border-blue-200">
          <h2 className="text-lg font-bold text-gray-500">사용자 정보 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-blue-100 rounded-full cursor-pointer "
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1 ">
              이름
            </label>
            <Input
              value={formData.userName}
              onChange={(e) => handleChange("userName", e.target.value)}
              className="border-blue-200"
            />
          </div>

          {/* 2. 사원번호 (수정 불가) */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              사원번호 (수정 불가)
            </label>
            <Input
              value={formData.accountId}
              onChange={(e) => handleChange("accountId", e.target.value)}
              disabled
              className="bg-gray-100 border-blue-200"
            />
          </div>

          {/* 3. 권한 */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              권한
            </label>
            <Select
              value={formData.role}
              onValueChange={(val) => handleChange("role", val as UserRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="권한 선택" />
              </SelectTrigger>
              <SelectContent className="border-blue-200 opacity-100">
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
              <label className="block text-sm font-medium text-gray-500 mb-1">
                소속 부서
              </label>
              <Select
                value={String(formData.departmentId || "")}
                onValueChange={(val) => {
                  const deptId = Number(val);
                  setFormData((prev) => ({
                    ...prev,
                    departmentId: deptId,
                    projectId: 0,
                  }));
                }}
                // ✨ MANAGER라면 부서 변경 비활성화 (자신 부서 고정)
                disabled={isManager}
              >
                <SelectTrigger className={isManager ? "bg-gray-100" : ""}>
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.dept_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 5. 소속 프로젝트 (일반사용자용) */}
          {/* ... (기존 프로젝트 코드 동일) ... */}
          {formData.role === "USER" && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
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

          <div className="flex justify-center space-x-2 mt-6 pt-4 border-t border-blue-100">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              className="border border-blue-100 point-hover"
            >
              취소
            </Button>
            <Button
              type="submit"
              className="bg-blue-500 cursor-pointer hover:bg-blue-700 text-white"
            >
              저장
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
