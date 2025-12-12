import React, { useState } from "react";
import { X, User as UserIcon, BadgeCheck } from "lucide-react";
import type { User, UserRole, Department, Project } from "@/types/UserType";
import { Button } from "@/components/ui/button";
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

const IMAGE_BASE_URL = "https://alain.r-e.kr";

interface UserEditModalProps {
  user: User;
  roles: OptionItem[];
  departments: Department[];
  projects: Project[];
  currentRole?: UserRole;
  onSave: (updatedUser: User) => void;
  onClose: () => void;
}

export default function UserEditModal({
  user,
  roles,
  departments,
  projects,
  currentRole,
  onSave,
  onClose,
}: UserEditModalProps) {
  const [formData, setFormData] = useState<User>({
    ...user,
    departmentId: user.departmentId || 0,
    projectId: user.projectId || 0,
  });

  const getProfileImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const fileName = path.split("/").pop();
    if (!fileName) return null;
    return `${IMAGE_BASE_URL}/static/profile/${fileName}`;
  };

  const previewUrl = getProfileImageUrl(user.profileImagePath);

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

  const isManager = currentRole === "MANAGER";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="flex justify-between items-center py-4 px-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            사용자 정보 수정
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 상단: 프로필 이미지 & 기본 읽기 전용 정보 */}
            <div className="flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">
              {/* 프로필 이미지 영역 */}
              <div className="shrink-0 mb-4 sm:mb-0">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center ring-1 ring-gray-200">
                  {/* [수정] 조건부 렌더링 명확화: 이미지가 있으면 img만, 없으면 아이콘만 */}
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={`${formData.userName} 프로필`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        // 이미지 로드 실패시 부모 div의 배경색이 보이거나, 필요시 상태를 바꿔 아이콘을 보여줄 수 있음
                      }}
                    />
                  ) : (
                    <UserIcon className="w-12 h-12 text-gray-400" />
                  )}
                </div>
              </div>

              {/* 이름 / 사원번호 (읽기 전용 Grid) */}
              <div className="grow w-full space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      이름
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-700 text-sm font-medium">
                      {formData.userName}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                      사원번호
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-500 text-sm">
                      {formData.employeeId || "-"}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                    계정 ID
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-500 text-sm">
                    {formData.accountId}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* 하단: 수정 가능한 권한 및 소속 정보 */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BadgeCheck size={16} className="text-blue-500" />
                권한 및 소속 설정
              </h3>

              <div className="grid grid-cols-1 gap-5">
                {/* 부서 및 프로젝트 Grid */}
                {(formData.role === "MANAGER" || formData.role === "USER") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                        disabled={isManager}
                      >
                        <SelectTrigger
                          className={
                            isManager
                              ? "bg-gray-50 text-gray-500"
                              : "border-gray-200"
                          }
                        >
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

                    {formData.role === "USER" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          소속 프로젝트
                        </label>
                        <Select
                          value={String(formData.projectId || "")}
                          onValueChange={(val) =>
                            handleChange("projectId", Number(val))
                          }
                          disabled={!formData.departmentId}
                        >
                          <SelectTrigger className="border-gray-200">
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
                  </div>
                )}

                {/* 권한 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    권한
                  </label>
                  <Select
                    value={formData.role}
                    onValueChange={(val) =>
                      handleChange("role", val as UserRole)
                    }
                  >
                    <SelectTrigger className="border-gray-200 focus:ring-2 focus:ring-blue-100 transition-all">
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
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
                className="px-5 py-2 h-10 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                취소
              </Button>
              <Button
                type="submit"
                className="px-6 py-2 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              >
                저장하기
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
