import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PendingFile = {
  id: string;
  file: File;
};

export default function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [collection, setCollection] = useState("default");
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files;
    if (!selected?.length) return;

    const nextFiles: PendingFile[] = Array.from(selected).map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      file,
    }));

    setFiles((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const merged = [...prev];
      nextFiles.forEach((entry) => {
        if (!existingIds.has(entry.id)) {
          merged.push(entry);
        }
      });
      return merged;
    });
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!files.length) {
      setShowConfirmation(false);
      return;
    }
    setIsSubmitting(true);
    // 백엔드 연동 전까지는 모의 흐름만 제공합니다.
    setTimeout(() => {
      setIsSubmitting(false);
      setShowConfirmation(true);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-12">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">
            문서 업로드
          </h1>
          <p className="text-sm text-slate-600">
            RAG 인덱싱 파이프라인으로 보낼 문서를 업로드합니다. 실제 업로드
            로직은 추후 API 연동 시 구현하며, 지금은 흐름을 확인할 수 있는
            와이어프레임 단계입니다.
          </p>
        </header>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                1. 문서 선택
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
                여러 파일을 한 번에 업로드할 수 있습니다. 지원 형식: HWPX, PDF,
                DOCX, CSV
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 hover:border-blue-200 hover:bg-blue-50/30">
                <div className="flex flex-col items-center gap-3">
                  <Upload className="size-8 text-blue-500" />
                  <div className="text-base font-medium text-slate-700">
                    파일을 끌어놓거나 클릭해서 선택하세요
                  </div>
                  <p className="text-xs text-slate-500">
                    최대 200MB, 최대 50개 파일
                  </p>
                  <Input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <span className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600">
                    파일 선택
                  </span>
                </div>
              </label>

              {files.length > 0 && (
                <ul className="space-y-2 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600">
                  {files.map(({ id, file }) => (
                    <li
                      key={id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-2"
                    >
                      <div>
                        <span className="font-medium text-slate-700">
                          {file.name}
                        </span>
                        <p className="text-xs text-slate-500">
                          {Math.round(file.size / 1024)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                        onClick={() => handleRemoveFile(id)}
                      >
                        제거
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                2. 메타데이터
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
                분류/메모 정보는 인덱싱 시 태깅에 활용됩니다. 추후 API 연동
                후에는 프로젝트, 보안 레벨 등 추가 필드를 확장할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  문서 분류
                </label>
                <select
                  value={collection}
                  onChange={(event) => setCollection(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="default">기본 컬렉션</option>
                  <option value="policy">정책/규정</option>
                  <option value="proposal">제안/기획</option>
                  <option value="data">데이터셋</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  업로드 메모
                </label>
                <textarea
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                  rows={4}
                  placeholder="선택 사항: 업로드 목적, 요청 사항 등을 기록하세요."
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 bg-blue-50/40 shadow-none">
            <CardContent className="flex flex-col gap-3 py-6 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">다음 단계 안내</p>
              <ol className="list-decimal space-y-2 pl-5">
                <li>업로드 완료 시 문서 리스트에서 처리 상태를 확인할 수 있습니다.</li>
                <li>텍스트 추출, 임베딩 생성 같은 비동기 작업은 준비 중입니다.</li>
                <li>추후 알림/웹훅 연동으로 상태 변화를 받아볼 수 있도록 확장될 예정입니다.</li>
              </ol>
            </CardContent>
          </Card>

          <CardFooter className="flex flex-col gap-4 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                총 {files.length}개 파일 • 대상 컬렉션: {collection || "미정"}
              </span>
              <button
                type="button"
                className="font-semibold text-blue-600 hover:text-blue-700"
                onClick={() => navigate("/docs")}
              >
                문서 목록 보기
              </button>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full gap-2 rounded-full py-3 text-base"
            >
              {isSubmitting ? "업로드 준비 중..." : "업로드 요청 보내기"}
            </Button>
            {showConfirmation && (
              <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="size-4" />
                <span>
                  모의 업로드가 완료되었습니다. 실제 업로드 로직은 API 연결 후
                  적용됩니다.
                </span>
              </div>
            )}
            {!files.length && !showConfirmation && (
              <p className="text-xs text-rose-500">
                업로드할 파일을 선택하고 다시 시도하세요.
              </p>
            )}
          </CardFooter>
        </form>
      </section>
    </div>
  );
}
