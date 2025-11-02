import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DocumentDetail = {
  id: string;
  title: string;
  type: string;
  status: "processing" | "ready" | "error";
  uploadedAt: string;
  size: string;
  owner: string;
  description: string;
  tags: string[];
  pages: number;
  preview: string;
  recentActivity: { actor: string; action: string; at: string }[];
};

type DocDetailModalProps = {
  doc: DocumentDetail;
  onClose: () => void;
};

const statusStyles: Record<DocumentDetail["status"], string> = {
  ready: "bg-emerald-100 text-emerald-700",
  processing: "bg-amber-100 text-amber-700",
  error: "bg-rose-100 text-rose-700",
};

export default function DocDetailModal({ doc, onClose }: DocDetailModalProps) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/70 px-4 py-10">
      <div className="relative flex w-full max-w-5xl max-h-[90vh] flex-col gap-6 overflow-y-auto bg-white p-6 shadow-2xl shadow-slate-900/20">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-slate-900">
                {doc.title}
              </h2>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
                  statusStyles[doc.status]
                )}
              >
                {doc.status === "ready"
                  ? "처리 완료"
                  : doc.status === "processing"
                  ? "처리 중"
                  : "오류"}
              </span>
            </div>
            <p className="text-sm text-slate-600">{doc.description}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>업로드: {doc.uploadedAt}</span>
              <span>•</span>
              <span>파일 크기: {doc.size}</span>
              <span>•</span>
              <span>페이지: {doc.pages}p</span>
              <span>•</span>
              <span>담당자: {doc.owner}</span>
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
          </div>
          <Button variant="ghost" onClick={onClose} className="text-slate-500">
            닫기
          </Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-semibold">
                문서 미리보기
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 py-6">
              <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient from-slate-50 via-white to-slate-100 p-6 text-sm text-slate-500">
                <p className="font-medium text-slate-700">
                  실제 문서 뷰어 자리
                </p>
                <p className="mt-2 leading-relaxed">
                  {doc.preview}
                  <br />
                  <br />
                  연결된 뷰어가 준비되면 이 영역에 원본 파일을 페이지 단위로
                  렌더링하고, 확대/축소 및 페이지 네비게이션 컨트롤을 배치할 수
                  있습니다.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="rounded-2xl border-slate-100">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-semibold">
                  문서 메타데이터
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 py-6 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-700">문서 유형</span>
                  <span>{doc.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-700">
                    업로드 일시
                  </span>
                  <span>{doc.uploadedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-700">
                    최근 업데이트
                  </span>
                  <span>{doc.recentActivity[0]?.at ?? "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-700">
                    담당자 / 팀
                  </span>
                  <span>{doc.owner}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-base font-semibold">
                  최근 작업 로그
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 py-6">
                {doc.recentActivity.map((item, index) => (
                  <div
                    key={`${item.actor}-${index}`}
                    className="rounded-xl border border-slate-100 px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-slate-700">
                      {item.actor} · {item.at}
                    </p>
                    <p className="mt-1 text-slate-600">{item.action}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
