"use client";
import { ChevronRight } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";

import { ProjectTable } from "./components/ProjectTable";
import { useAuthStore } from "@/store/authStore";
import { useSystemStore } from "@/store/systemStore";

import { FilterCombobox } from "@/components/common/FilterCombobox";
import { RequestModal } from "./components/modal/RequestModal";
import { UploadModal } from "./components/modal/UploadModal";

// Types
interface SummaryCardProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

interface OptionItem {
  value: string;
  label: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  count,
  children,
}) => {
  return (
    <div className="w-72 h-24 border border-blue-100 rounded-xl bg-white flex flex-col justify-between p-1 shadow-sm">
      <div className="flex px-3 py-1 items-center justify-between border-b border-blue-50/50">
        <div className="text-lg font-bold text-slate-700">{title}</div>
        <div className="rounded-full px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold">
          {count}개
        </div>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
};

export default function ProjectPage() {
  const { user } = useAuthStore();
  const { departments, projects, fetchSystemData } = useSystemStore();

  const isUser = user?.role === "USER";
  const isManager = user?.role === "MANAGER";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  // ---------------------------------------------------------
  // State: 이름 대신 ID(string) 관리
  // ---------------------------------------------------------
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedProjId, setSelectedProjId] = useState<string>("");

  // 권한별 초기값 설정
  useEffect(() => {
    if (!user) return;
    if (isUser || isManager) {
      if (user.departmentId) setSelectedDeptId(String(user.departmentId));
    }
    // 프로젝트는 초기화 (선택 강제 X)
    setSelectedProjId("");
  }, [user, isUser, isManager]);

  // 부서 변경 시 프로젝트 선택 초기화
  useEffect(() => {
    if (!isUser) setSelectedProjId("");
  }, [selectedDeptId, isUser]);

  // ---------------------------------------------------------
  // 옵션 데이터 생성
  // ---------------------------------------------------------
  const departmentOptions: OptionItem[] = useMemo(() => {
    return departments.map((d) => ({
      value: String(d.id),
      label: d.dept_name,
    }));
  }, [departments]);

  const filteredProjects: OptionItem[] = useMemo(() => {
    if (!selectedDeptId) return [];
    const targetId = Number(selectedDeptId);
    return projects
      .filter((p) => p.departmentId === targetId)
      .map((p) => ({
        value: String(p.id),
        label: p.name,
      }));
  }, [selectedDeptId, projects]);

  // 현재 선택된 객체 찾기 (ID 기반)
  const currentDeptData = departments.find(
    (d) => String(d.id) === selectedDeptId
  );
  const currentProjectData = projects.find(
    (p) => String(p.id) === selectedProjId
  );

  const departmentCount = isSuperAdmin ? departmentOptions.length : 1;
  const projectCount = filteredProjects.length;

  return (
    <div className="w-full h-full overflow-auto  flex flex-col gap-8 page-layout p-8">
      {/* 상단 영역: 헤더 & 업로드 컨텍스트 설정 */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-2">
            <h1 className="page-title text-2xl font-bold text-gray-800">
              문서 관리
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              문서를 업로드하거나 관리할 부서와 프로젝트를 선택하세요.
            </p>
          </div>

          {/* 모달 버튼 */}
          {isUser ? (
            <RequestModal
              projectId={currentProjectData?.id}
              projectName={currentProjectData?.name || ""}
              departmentId={
                currentProjectData?.departmentId || Number(selectedDeptId)
              }
            />
          ) : (
            <UploadModal
              departmentId={currentDeptData?.id}
              projectId={currentProjectData?.id}
              projectName={currentProjectData?.name || "프로젝트 미선택"}
              disabled={!currentProjectData}
            />
          )}
        </div>

        {/* 컨텍스트 선택 카드 */}
        <div className="flex flex-col">
          <div className="flex items-center gap-4 p-4 justify-center">
            <SummaryCard title="부서" count={departmentCount}>
              <FilterCombobox<string>
                options={departmentOptions}
                selectedValue={selectedDeptId}
                onValueChange={setSelectedDeptId}
                placeholder="부서 선택"
                disabled={isUser || isManager}
                className="w-full border-none shadow-none bg-transparent"
              />
            </SummaryCard>

            <ChevronRight className="w-6 h-6 text-slate-300 shrink-0" />

            <SummaryCard title="프로젝트" count={projectCount}>
              <FilterCombobox<string>
                options={filteredProjects}
                selectedValue={selectedProjId}
                onValueChange={setSelectedProjId}
                placeholder={
                  selectedDeptId ? "프로젝트를 선택하세요" : "부서 선행"
                }
                disabled={!selectedDeptId}
                className="w-full border-none shadow-none bg-transparent"
              />
            </SummaryCard>
          </div>
          <div className="text-center text-xs text-gray-400 px-4 justify-center">
            * 이곳에서의 선택은 <strong>업로드 및 요청</strong>을 위한 것입니다.
            <br />* 문서 목록 필터링은 아래 테이블 상단에서 설정하세요.
          </div>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="flex-1">
        <ProjectTable
          selectedDeptId={Number(selectedDeptId) || 0}
          currentUserRole={user?.role || ""}
          // [핵심 수정] 상단에서 선택된 프로젝트 ID를 테이블로 전달 (없으면 undefined)
          selectedProjectId={
            selectedProjId ? Number(selectedProjId) : undefined
          }
        />
      </div>
    </div>
  );
}
