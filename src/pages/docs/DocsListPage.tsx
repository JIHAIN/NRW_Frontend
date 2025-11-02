import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DocDetailModal, {
  type DocumentDetail,
} from "@/pages/docs/DocDetailPage";
import { cn } from "@/lib/utils";

const mockDocuments: DocumentDetail[] = [
  {
    id: "DOC-2024-001",
    title: "AI 프로젝트 제안서 v3.1",
    type: "HWPX 보고서",
    status: "ready",
    uploadedAt: "2024-10-12 14:23",
    size: "2.4 MB",
    owner: "김민지 / 전략기획팀",
    description:
      "AI 프로젝트의 추진 배경과 추진 전략, RAG 기반 질의 시스템 도입 계획을 정리한 문서입니다.",
    tags: ["제안서", "AI", "RAG", "전략"],
    pages: 18,
    preview:
      "프로젝트 목표\n- 사내 문서 검색 효율화\n- 근거 기반 질의응답 제공\n\n핵심 일정\n1. PoC (11월)\n2. 본개발 (12월~)\n3. 베타 오픈 (3월)",
    recentActivity: [
      {
        actor: "김민지",
        action: "문서 본문을 최신 요구사항으로 업데이트했습니다.",
        at: "2024-10-14 09:12",
      },
      {
        actor: "홍길동",
        action: "QA 세션에서 12건의 질의가 처리되었습니다.",
        at: "2024-10-13 18:45",
      },
    ],
  },
  {
    id: "DOC-2024-017",
    title: "규정집 2024 개정본",
    type: "PDF",
    status: "processing",
    uploadedAt: "2024-10-18 09:01",
    size: "6.2 MB",
    owner: "정예린 / 운영지원팀",
    description:
      "사내 업무 규정 변경분에 대한 정리 자료. 현재 OCR 기반 텍스트 추출이 진행 중입니다.",
    tags: ["규정", "운영지원", "OCR"],
    pages: 72,
    preview:
      "업데이트 요약\n- 휴가 규정 개정\n- 보안 정책 추가 항목\n\n처리 상태: 텍스트 추출 중 (35%)",
    recentActivity: [
      {
        actor: "시스템",
        action: "텍스트 추출 작업이 35% 진행되었습니다.",
        at: "2024-10-18 09:27",
      },
      {
        actor: "정예린",
        action: "신규 규정 PDF를 업로드했습니다.",
        at: "2024-10-18 09:01",
      },
    ],
  },
  {
    id: "DOC-2024-021",
    title: "문서 QA 로그 10월 3주차",
    type: "CSV",
    status: "ready",
    uploadedAt: "2024-10-20 21:14",
    size: "950 KB",
    owner: "데이터팀",
    description:
      "문서 QA 서비스 사용 로그와 세션 요약 데이터. 인사이트 추출을 위한 데이터셋입니다.",
    tags: ["로그", "QA", "데이터"],
    pages: 4,
    preview:
      "10월 3주차 주요 지표 요약\n- 총 질의: 432건\n- 평균 응답시간: 1.8초\n- 실패율: 4.2%",
    recentActivity: [
      {
        actor: "데이터팀",
        action: "요약 통계를 포함한 CSV를 다시 업로드했습니다.",
        at: "2024-10-20 21:14",
      },
    ],
  },
  {
    id: "DOC-2024-026",
    title: "고객 Onboarding 매뉴얼 초안",
    type: "DOCX",
    status: "error",
    uploadedAt: "2024-10-22 11:05",
    size: "1.1 MB",
    owner: "CS팀",
    description:
      "CS 매뉴얼 초안. 파일 포맷 변환 중 에러가 발생해 재업로드가 필요합니다.",
    tags: ["CS", "매뉴얼", "에러"],
    pages: 26,
    preview:
      "현재 문서를 열 수 없습니다. 원본 파일 재확인이 필요합니다.\n\n에러 코드: CONVERT-415",
    recentActivity: [
      {
        actor: "시스템",
        action: "파일 포맷 변환 중 오류가 감지되었습니다.",
        at: "2024-10-22 11:07",
      },
      {
        actor: "최지원",
        action: "초안 버전을 업로드했습니다.",
        at: "2024-10-22 11:05",
      },
    ],
  },
];

const statusLabel: Record<DocumentDetail["status"], string> = {
  ready: "처리 완료",
  processing: "처리 중",
  error: "오류",
};

const statusBadge: Record<DocumentDetail["status"], string> = {
  ready: "bg-emerald-100 text-emerald-700",
  processing: "bg-amber-100 text-amber-700",
  error: "bg-rose-100 text-rose-700",
};

export default function DocsListPage() {
  const [selectedDoc, setSelectedDoc] = useState<DocumentDetail | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    DocumentDetail["status"] | "all"
  >("all");

  const filteredDocuments = useMemo(() => {
    return mockDocuments.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesStatus =
        statusFilter === "all" ? true : doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-12">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              업로드 문서 관리
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              최신 업로드 문서를 한눈에 확인하고 RAG 파이프라인 상태, 전처리
              진행 상황을 추적할 수 있는 대시보드입니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/upload">
              <Button className="gap-2 rounded-full px-5 py-2">
                <Plus className="size-4" />새 문서 업로드
              </Button>
            </Link>
          </div>
        </header>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-6">
            <CardTitle className="text-base font-semibold text-slate-900">
              문서 목록
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-xs md:w-3/5">
                <Search className="size-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="문서 제목, 설명 또는 태그 검색"
                  className="border-none px-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="statusFilter"
                  className="text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  상태 필터
                </label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as DocumentDetail["status"] | "all"
                    )
                  }
                  className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">전체</option>
                  <option value="ready">처리 완료</option>
                  <option value="processing">처리 중</option>
                  <option value="error">오류</option>
                </select>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {filteredDocuments.map((doc) => (
                <Card
                  key={doc.id}
                  className="flex h-full flex-col justify-between rounded-3xl border-slate-100 transition-transform hover:-translate-y-1 hover:shadow-lg"
                >
                  <CardHeader className="space-y-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          {doc.title}
                        </CardTitle>
                        <p className="text-sm text-slate-600">
                          {doc.description}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                          statusBadge[doc.status]
                        )}
                      >
                        {statusLabel[doc.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {doc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-6">
                    <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                      <div>
                        <dt className="font-medium text-slate-600">
                          업로드 일시
                        </dt>
                        <dd>{doc.uploadedAt}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-600">
                          파일 크기
                        </dt>
                        <dd>{doc.size}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-600">
                          문서 유형
                        </dt>
                        <dd>{doc.type}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-600">
                          담당자 / 팀
                        </dt>
                        <dd>{doc.owner}</dd>
                      </div>
                    </dl>
                  </CardContent>
                  <CardFooter className="border-t border-slate-100 pt-4">
                    <Button
                      variant="outline"
                      className="w-full rounded-full"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      세부 정보 보기
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {filteredDocuments.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center text-sm text-slate-500">
                  <p className="font-medium text-slate-600">
                    조건에 맞는 문서가 없습니다.
                  </p>
                  <p className="mt-2">
                    검색어 또는 상태 필터를 조정하거나 새 문서를 업로드해
                    주세요.
                  </p>
                  <Link to="/upload" className="mt-4">
                    <Button className="rounded-full px-5 py-2">
                      문서 업로드
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {selectedDoc && (
        <DocDetailModal
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}
