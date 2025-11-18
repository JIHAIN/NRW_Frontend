"use client";
import { ChevronRight } from "lucide-react";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";

import { ProjectTable } from "./components/ProjectTable";

// ✨ 1. 더미 데이터 임포트 삭제 -> Store 임포트
import { useAuthStore } from "@/store/authStore";
import { useSystemStore } from "@/store/systemStore";

import { FilterCombobox } from "@/components/common/FilterCombobox";
import { RequestModal } from "./components/modal/RequestModal";
import { UploadModal } from "./components/modal/UploadModal";

// --------------------------------------------------------------------------
// SummaryCard (그대로 유지)
// --------------------------------------------------------------------------
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
    <div className="w-70 h-20  border border-blue-100 rounded-md bg-white flex flex-col justify-between">
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

export default function ProjectPage() {
  // 1. 전역 스토어 구독
  const { role, department, project } = useAuthStore();

  // ✨ 2. 시스템 데이터(부서/프로젝트) 구독
  const { departments, projects, fetchSystemData } = useSystemStore();

  // 권한 체크
  const isUser = role === "user";
  const isManager = role === "manager";
  const isUserOrManager = isUser || isManager;

  // 화면 로컬 상태
  const [selectedDepartment, setSelectedDepartment] = useState(
    isUserOrManager ? department : ""
  );
  const [selectedProject, setSelectedProject] = useState(isUser ? project : "");

  // ✨ 3. 페이지 진입 시 데이터 최신화 (DB 데이터 가져오기)
  useEffect(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  // ✨ 4. 전역 설정(TestAuthPanel) 변경 시 로컬 상태 동기화
  useEffect(() => {
    if (isUser) {
      setSelectedDepartment(department);
      setSelectedProject(project);
    } else if (isManager) {
      setSelectedDepartment(department);
      setSelectedProject("");
    } else {
      // super_admin 등
    }
  }, [role, department, project, isUser, isManager]);

  // ---------------------------------------------------------
  // ✨ 5. 옵션 데이터 생성 (DUMMY -> departments/projects store 데이터 사용)
  // ---------------------------------------------------------

  // 5-1. 부서 옵션
  const departmentOptions: OptionItem[] = useMemo(() => {
    return departments.map((d) => ({
      value: d.name,
      label: d.name,
    }));
  }, [departments]); // departments가 바뀔 때만 재계산

  const departmentCount = isUserOrManager ? 1 : departmentOptions.length;

  // 5-2. 프로젝트 옵션 (선택된 부서 기준 필터링)
  const filteredProjects: OptionItem[] = useMemo(() => {
    if (!selectedDepartment) {
      return [];
    }

    // 선택된 부서 이름으로 ID 찾기
    const selectedDeptId = departments.find(
      (d) => d.name === selectedDepartment
    )?.id;

    if (!selectedDeptId) {
      return [];
    }

    //  departmentId(DB컬럼명)를 사용하여 필터링
    return projects
      .filter((p) => p.departmentId === selectedDeptId)
      .map((p) => ({
        value: p.name,
        label: p.name,
      }));
  }, [selectedDepartment, departments, projects]);

  const projectCount = isUser ? 1 : filteredProjects.length;

  // 부서 변경 시 프로젝트 선택 초기화 (사용자가 직접 바꿀 때)
  useEffect(() => {
    if (!isUser) {
      // 일반 유저가 아닐 때만
      setSelectedProject("");
    }
  }, [selectedDepartment, isUser]);

  //  현재 선택된 부서 정보 (ID 필요 - 업로드 시 departmentId 전송용)
  const currentDeptData = useMemo(() => {
    return departments.find((d) => d.name === selectedDepartment);
  }, [departments, selectedDepartment]);

  // 현재 선택된 프로젝트의 ID 찾기 (모달에 넘겨주기 위함)
  const currentProjectData = useMemo(() => {
    return projects.find((p) => p.name === selectedProject);
  }, [projects, selectedProject]);

  return (
    <div className="w-full h-full bg-white flex flex-col gap-12 page-layout ">
      {/* 상단 헤더 및 버튼 */}
      <div className="flex flex-col gap-4">
        <div className="page-title">문서관리</div>
        <div className="flex justify-between">
          <span></span>

          {/* 버튼 분기 처리 (User -> 요청모달, Admin -> 업로드) */}
          {isUser ? (
            <RequestModal
              projectId={currentProjectData?.id || null}
              projectName={currentProjectData?.name || ""}
            />
          ) : (
            //  관리자용 업로드 모달로 교체
            <UploadModal
              departmentId={currentDeptData?.id}
              projectId={currentProjectData?.id}
              projectName={currentProjectData?.name || "프로젝트 미선택"}
              disabled={!currentProjectData} // 프로젝트 선택 안 하면 버튼 비활성화
            />
          )}
        </div>

        {/* 필터 콤보박스 영역 */}
        <div className="flex justify-center items-center gap-4">
          {/* 부서 선택 */}
          <SummaryCard title="부서" count={departmentCount}>
            <FilterCombobox
              options={departmentOptions}
              selectedValue={selectedDepartment}
              onValueChange={setSelectedDepartment}
              placeholder="부서 선택"
              disabled={isUserOrManager}
            />
          </SummaryCard>

          <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />

          {/* 프로젝트 선택 */}
          <SummaryCard title="프로젝트" count={projectCount}>
            <FilterCombobox
              options={filteredProjects}
              selectedValue={selectedProject}
              onValueChange={setSelectedProject}
              placeholder={
                selectedDepartment ? "프로젝트 선택" : "부서를 먼저 선택하세요"
              }
              disabled={isUser}
            />
          </SummaryCard>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div>
        <ProjectTable
          selectedDepartment={selectedDepartment}
          selectedProject={selectedProject}
          currentUserRole={role}
        />
      </div>
    </div>
  );
}
