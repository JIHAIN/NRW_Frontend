"use client";
import { ChevronRight, Plus } from "lucide-react";

import * as React from "react";
import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";

import { Link } from "react-router-dom";
import { ProjectTable } from "./components/ProjectTable";

// 💡 1. 통합 데이터 및 타입 임포트 (경로 확인)
import type { Department, Project } from "../../types/UserType";
import { DUMMY_DEPARTMENTS, DUMMY_PROJECTS } from "@/types/dummy_data";
import { FilterCombobox } from "@/components/common/FilterCombobox";

// --------------------------------------------------------------------------
// ✨ SummaryCard 컴포넌트
// --------------------------------------------------------------------------
interface SummaryCardProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

interface OptionItem {
  value: string; // 부서 이름 또는 프로젝트 이름 (ProjectTable과 연동을 위해)
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
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProject, setSelectedProject] = useState("");

  // 1. 부서 옵션
  const departmentOptions: OptionItem[] = useMemo(() => {
    return DUMMY_DEPARTMENTS.map((d: Department) => ({
      value: d.name,
      label: d.name, // 부서 이름(name)을 value와 label로 사용
    }));
  }, []);
  const departmentCount = departmentOptions.length;

  // 2. 선택된 부서에 따른 프로젝트 옵션 필터링
  const filteredProjects: OptionItem[] = useMemo(() => {
    if (!selectedDepartment) {
      return [];
    }

    // 선택된 부서 이름으로 부서 ID를 찾습니다.
    const selectedDeptId = DUMMY_DEPARTMENTS.find(
      (d) => d.name === selectedDepartment
    )?.id;

    if (!selectedDeptId) {
      return [];
    }

    // 해당 부서 ID를 가진 프로젝트만 필터링하고 OptionItem으로 변환
    return DUMMY_PROJECTS.filter(
      (p: Project) => p.departmentId === selectedDeptId
    ).map((p: Project) => ({
      value: p.name,
      label: p.name, // 프로젝트 이름(name)을 value와 label로 사용
    }));
  }, [selectedDepartment]);

  const projectCount = filteredProjects.length;

  // 부서가 변경될 때 프로젝트 선택 초기화
  React.useEffect(() => {
    setSelectedProject("");
  }, [selectedDepartment]);

  return (
    <div className="w-full h-full bg-white flex flex-col gap-12 page-layout ">
      {/* 부서, 프로젝트 선택 확인 및 추가 */}
      <div className="flex flex-col gap-4">
        <div className="page-title">문서관리</div>
        <div className="flex justify-between">
          <span></span>
          <Link to="/upload">
            <Button className="gap-2 border rounded-2xl px-5 py-2 text-blue-900/70 point-hover">
              <Plus className="size-4 text-blue-500" />
              문서 업로드
            </Button>
          </Link>
        </div>

        <div className="flex justify-center items-center gap-4">
          {/* 부서 SummaryCard */}
          <SummaryCard title="부서" count={departmentCount}>
            <FilterCombobox
              options={departmentOptions}
              selectedValue={selectedDepartment}
              onValueChange={setSelectedDepartment}
              placeholder="부서 선택"
            />
          </SummaryCard>

          {/* 중간 아이콘 */}
          <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />

          {/* 프로젝트 SummaryCard */}
          <SummaryCard title="프로젝트" count={projectCount}>
            <FilterCombobox
              options={filteredProjects}
              selectedValue={selectedProject}
              onValueChange={setSelectedProject}
              placeholder={
                selectedDepartment ? "프로젝트 선택" : "부서를 먼저 선택하세요"
              }
            />
          </SummaryCard>
        </div>
      </div>

      {/* 5. ProjectTable에 선택된 부서/프로젝트 값 전달 */}
      <div>
        <ProjectTable
          selectedDepartment={selectedDepartment}
          selectedProject={selectedProject}
        />
      </div>
    </div>
  );
}
