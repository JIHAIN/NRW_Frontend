"use client";
import { ChevronRight, Plus } from "lucide-react";
import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { FilterCombobox } from "@/components/common/FilterCombobox";
import { ProjectTable } from "./components/ProjectTable";

// ✨ Store 임포트
import { useAuthStore } from "@/store/authStore";

// 데이터 타입
import type { Department, Project } from "../../types/UserType";
import { DUMMY_DEPARTMENTS, DUMMY_PROJECTS } from "@/types/dummy_data";

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
    <div className="w-70 h-20 border border-blue-100 rounded-md bg-white flex flex-col justify-between">
      <div className="flex p-1 px-3 items-center gap-x-2 border-b border-blue-100">
        <div className="text-[1.3rem]">{title}</div>
        <div className="rounded-2xl h-fit px-3 mt-1 bg-blue-700 text-white text-[0.8rem]">
          {count}개
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default function ProjectPage() {
  // ✨ 1. 전역 스토어 구독 (테스트 데이터 삭제됨)
  const { role, department, project } = useAuthStore();

  // 권한 체크 헬퍼
  const isUser = role === "user";
  const isManager = role === "manager";
  const isUserOrManager = isUser || isManager;

  // ✨ 2. 화면의 필터 상태 관리
  // (초기값을 전역 설정에 맞춰서 세팅)
  const [selectedDepartment, setSelectedDepartment] = useState(
    isUserOrManager ? department : ""
  );
  const [selectedProject, setSelectedProject] = useState(isUser ? project : "");

  // ✨ 3. 전역 설정(TestAuthPanel)이 바뀌면 화면 필터도 강제 동기화
  useEffect(() => {
    if (isUser) {
      setSelectedDepartment(department);
      setSelectedProject(project);
    } else if (isManager) {
      setSelectedDepartment(department);
      setSelectedProject(""); // 매니저는 부서만 고정, 프로젝트는 선택 가능
    } else {
      // super_admin은 자유
      // (원하면 여기서 초기화 안 하고 유지하게 둘 수도 있음)
    }
  }, [role, department, project, isUser, isManager]);

  // --- 이하 로직은 기존과 동일 ---

  // 부서 옵션
  const departmentOptions: OptionItem[] = useMemo(() => {
    return DUMMY_DEPARTMENTS.map((d: Department) => ({
      value: d.name,
      label: d.name,
    }));
  }, []);

  const departmentCount = isUserOrManager ? 1 : departmentOptions.length;

  // 프로젝트 옵션 (선택된 부서 기준)
  const filteredProjects: OptionItem[] = useMemo(() => {
    if (!selectedDepartment) return [];
    const selectedDeptId = DUMMY_DEPARTMENTS.find(
      (d) => d.name === selectedDepartment
    )?.id;
    if (!selectedDeptId) return [];
    return DUMMY_PROJECTS.filter(
      (p: Project) => p.departmentId === selectedDeptId
    ).map((p: Project) => ({ value: p.name, label: p.name }));
  }, [selectedDepartment]);

  const projectCount = isUser ? 1 : filteredProjects.length;

  return (
    <div className="w-full h-full bg-white flex flex-col gap-12 page-layout">
      {/* ✨ 상단부: 제목 및 버튼 */}
      <div className="flex flex-col gap-4">
        <div className="page-title">문서관리</div>
        <div className="flex justify-between">
          <span></span>
          {/* 관리자급에게만 '업로드' 버튼 표시 */}
          {!isUser && (
            <Link to="/admin/upload">
              <Button className="gap-2 border rounded-2xl px-5 py-2 text-blue-900/70 point-hover">
                <Plus className="size-4 text-blue-500" />
                문서 업로드
              </Button>
            </Link>
          )}
        </div>

        {/* ✨ 필터링 영역 */}
        <div className="flex justify-center items-center gap-4">
          <SummaryCard title="부서" count={departmentCount}>
            <FilterCombobox
              options={departmentOptions}
              selectedValue={selectedDepartment}
              onValueChange={setSelectedDepartment}
              placeholder="부서 선택"
              disabled={isUserOrManager} // 권한에 따라 잠금
            />
          </SummaryCard>

          <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />

          <SummaryCard title="프로젝트" count={projectCount}>
            <FilterCombobox
              options={filteredProjects}
              selectedValue={selectedProject}
              onValueChange={setSelectedProject}
              placeholder={
                selectedDepartment ? "프로젝트 선택" : "부서를 먼저 선택하세요"
              }
              disabled={isUser} // 유저는 프로젝트도 잠금
            />
          </SummaryCard>
        </div>
      </div>

      {/* ✨ 테이블 영역 */}
      <div>
        <ProjectTable
          selectedDepartment={selectedDepartment}
          selectedProject={selectedProject}
          currentUserRole={role} // 테이블에 권한 전달
        />
      </div>
    </div>
  );
}
