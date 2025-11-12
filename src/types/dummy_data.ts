// src/data/index.ts

import {
  type Department,
  type Project,
  type User,
  type Document,
  type UserRole,
} from "./UserType"; // 통합 타입 임포트

// --- 1. 부서 (Department) 더미 데이터 (8개) ---
export const DUMMY_DEPARTMENTS: Department[] = [
  { id: 101, name: "경영지원팀" },
  { id: 102, name: "개발팀" },
  { id: 103, name: "마케팅팀" },
  { id: 104, name: "영업팀" },
  { id: 105, name: "디자인팀" },
  { id: 106, name: "인사팀" },
  { id: 107, name: "품질관리팀" },
  { id: 108, name: "재무팀" },
];

// --- 2. 프로젝트 (Project) 더미 데이터 (20개) ---
export const DUMMY_PROJECTS: Project[] = Array.from({ length: 20 }, (_, i) => ({
  id: 201 + i,
  name: `프로젝트 A-${201 + i} (${DUMMY_DEPARTMENTS[i % 8].name})`,
  departmentId: DUMMY_DEPARTMENTS[i % 8].id,
  creationDate: `2025-10-${(i % 30) + 1 < 10 ? "0" : ""}${(i % 30) + 1}`,
}));

// src/data/index.ts (계속)

// --- 3. 사용자 (User) 더미 데이터 (30명, 역할 비율 적용) ---
const ALL_ROLES: UserRole[] = ["총괄 관리자", "관리자", "일반 사용자"];

export const DUMMY_USERS: User[] = Array.from({ length: 30 }, (_, i) => {
  const roleIndex = i % 10 < 1 ? 0 : i % 10 < 3 ? 1 : 2; // 1:2:7 비율
  const role = ALL_ROLES[roleIndex];
  const deptId = DUMMY_DEPARTMENTS[i % 8].id;

  const user: User = {
    id: 1001 + i,
    name: `사용자_${1001 + i}`,
    email: `user${1001 + i}@company.com`,
    role: role,
    managedDepartmentIds: [],
    departmentId: deptId,
    projectIds: [],
  };

  if (role === "총괄 관리자") {
    // 총괄 관리자는 모든 부서 관리
    user.managedDepartmentIds = DUMMY_DEPARTMENTS.map((d) => d.id);
    user.departmentId = DUMMY_DEPARTMENTS[0].id; // 소속은 임의로 첫 부서
  } else if (role === "관리자") {
    // 관리자는 본인 소속 부서 포함 1~2개 부서 관리
    user.managedDepartmentIds = [deptId, DUMMY_DEPARTMENTS[(i + 1) % 8].id]
      .filter((v, idx, arr) => arr.indexOf(v) === idx)
      .slice(0, Math.random() < 0.3 ? 2 : 1);
  }
  // 일반 사용자는 소속 부서 및 해당 부서 프로젝트 배정
  user.projectIds = DUMMY_PROJECTS.filter((p) => p.departmentId === deptId)
    .map((p) => p.id)
    .slice(0, Math.floor(Math.random() * 3)); // 최대 3개 프로젝트 배정

  return user;
});

// src/data/index.ts (계속)

// --- 4. 문서 (Document) 더미 데이터 (150개) ---
export const DUMMY_DOCUMENTS: Document[] = Array.from(
  { length: 150 },
  (_, i) => ({
    id: i + 1,
    name: `프로젝트 문서 ${i + 1} - ${i % 5 === 0 ? "회의록" : "요구사항"}.pdf`,
    location:
      i % 3 === 0 ? "내부 서버" : i % 5 === 0 ? "외부 공유" : "클라우드",
    created: `2025-10-${(i % 30) + 1 < 10 ? "0" : ""}${(i % 30) + 1}`,
    status: i % 4 === 0 ? "진행 중" : i % 7 === 0 ? "보류" : "완료",
    completed:
      i % 4 !== 0
        ? `2025-11-${(i % 30) + 5 < 10 ? "0" : ""}${(i % 30) + 5}`
        : "",
    projectId: DUMMY_PROJECTS[i % DUMMY_PROJECTS.length].id,
  })
);
