"use client";
import { ChevronRight } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";

import { ProjectTable } from "./components/ProjectTable";
import { useAuthStore } from "@/store/authStore";
import { useSystemStore } from "@/store/systemStore";

import { FilterCombobox } from "@/components/common/FilterCombobox";
import { RequestModal } from "./components/modal/RequestModal";
import { UploadModal } from "./components/modal/UploadModal";

// --------------------------------------------------------------------------
// Types & Components
// --------------------------------------------------------------------------
interface SummaryCardProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

interface OptionItem {
  value: string; // Combobox는 value로 string을 기대함 (ID를 string으로 변환해서 사용)
  label: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  count,
  children,
}) => {
  return (
    <div className="w-70 h-20 border border-blue-100 rounded-md bg-white flex flex-col justify-between">
      <div className="flex p-1 px-3 items-center gap-x-2 border-b border-blue-100">
        <div className="text-[1.3rem] ">{title}</div>
        <div className="rounded-2xl h-fit px-3 mt-1 bg-blue-700 text-white text-[0.8rem]">
          {count}개
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
};

// --------------------------------------------------------------------------
// 메인 컴포넌트
// --------------------------------------------------------------------------
export default function ProjectPage() {
  const { user } = useAuthStore();
  const { departments, projects, fetchSystemData } = useSystemStore();

  // 권한 체크
  const isUser = user?.role === "USER";
  const isManager = user?.role === "MANAGER";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // 1. 시스템 데이터 로드
  useEffect(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  // ---------------------------------------------------------
  // ✨ 상태 관리: 이름이 아닌 "ID"를 관리 (String형태의 ID)
  // ---------------------------------------------------------
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedProjId, setSelectedProjId] = useState<string>("");

  // 2. 권한에 따른 초기값 및 강제 설정 (useEffect 하나로 통합 관리)
  useEffect(() => {
    if (!user) return;

    if (isUser) {
      // 일반 유저: 본인 부서/프로젝트 ID로 강제 고정
      if (user.departmentId) setSelectedDeptId(String(user.departmentId));
      if (user.projectId) setSelectedProjId(String(user.projectId));
    } else if (isManager) {
      // 관리자: 본인 부서 ID로 강제 고정, 프로젝트는 선택 안 함(전체)
      if (user.departmentId) setSelectedDeptId(String(user.departmentId));
      setSelectedProjId("");
    } else if (isSuperAdmin) {
      // 총괄: 자유 선택 (초기값 없음 or 유지)
      // 별도 로직 불필요
    }
  }, [user, isUser, isManager, isSuperAdmin]);

  // 3. 부서 변경 시 프로젝트 선택 초기화 (관리자/총괄용)
  // (부서가 바뀌면 기존 선택된 프로젝트 ID는 유효하지 않을 수 있으므로)
  useEffect(() => {
    if (!isUser) {
      setSelectedProjId("");
    }
  }, [selectedDeptId, isUser]);

  // ---------------------------------------------------------
  // 옵션 데이터 생성 (Value = ID string, Label = Name)
  // ---------------------------------------------------------

  // 부서 옵션
  const departmentOptions: OptionItem[] = useMemo(() => {
    return departments.map((d) => ({
      value: String(d.id), // ID를 Value로 사용
      label: d.name, // 이름을 Label로 사용
    }));
  }, [departments]);

  // 프로젝트 옵션 (선택된 Dept ID 기준 필터링)
  const filteredProjects: OptionItem[] = useMemo(() => {
    if (!selectedDeptId) return [];

    const targetId = Number(selectedDeptId); // string ID -> number 변환

    return projects
      .filter((p) => p.departmentId === targetId) // ID로 정확하게 비교
      .map((p) => ({
        value: String(p.id),
        label: p.name,
      }));
  }, [selectedDeptId, projects]);

  // ---------------------------------------------------------
  // 현재 선택된 객체 찾기 (ID 기반 검색 - 훨씬 빠르고 안전함)
  // ---------------------------------------------------------
  const currentDeptData = departments.find(
    (d) => String(d.id) === selectedDeptId
  );
  const currentProjectData = projects.find(
    (p) => String(p.id) === selectedProjId
  );

  // 카운트 계산
  const departmentCount = isSuperAdmin ? departmentOptions.length : 1;
  const projectCount = isUser ? 1 : filteredProjects.length;

  return (
    <div className="w-full h-full bg-white flex flex-col gap-12 page-layout">
      {/* 상단 헤더 */}
      <div className="flex flex-col gap-4">
        <div className="page-title">문서관리</div>
        <div className="flex justify-between">
          <span></span>

          {/* 모달 버튼 영역 */}
          {isUser ? (
            <RequestModal
              projectId={currentProjectData?.id || null}
              projectName={currentProjectData?.name || ""}
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

        {/* 필터 영역 */}
        <div className="flex justify-center items-center gap-4">
          {/* 부서 필터 */}
          <SummaryCard title="부서" count={departmentCount}>
            <FilterCombobox<string>
              options={departmentOptions}
              selectedValue={selectedDeptId} // ID가 들어감
              onValueChange={setSelectedDeptId}
              placeholder="부서 선택"
              disabled={isUser || isManager}
            />
          </SummaryCard>

          <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />

          {/* 프로젝트 필터 */}
          <SummaryCard title="프로젝트" count={projectCount}>
            <FilterCombobox<string>
              options={filteredProjects}
              selectedValue={selectedProjId} // ID가 들어감
              onValueChange={setSelectedProjId}
              placeholder={
                selectedDeptId ? "프로젝트 선택" : "부서를 먼저 선택하세요"
              }
              disabled={isUser}
            />
          </SummaryCard>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div>
        {/* 주의: ProjectTable도 이제 이름이 아닌 ID(혹은 이름)를 받도록 수정되어야 할 수 있습니다.
           만약 ProjectTable이 '이름'을 원한다면 여기서 변환해서 내려주면 되고,
           'ID'를 원한다면 그대로 내려주면 됩니다.
        */}
        <ProjectTable
          selectedDepartment={currentDeptData?.name || ""} // ID로 찾은 객체의 이름을 전달
          selectedProject={currentProjectData?.name || ""} // ID로 찾은 객체의 이름을 전달
          currentUserRole={user?.role || ""}
        />
      </div>
    </div>
  );
}
