import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";

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
import { uploadDocument } from "@/services/documents.service";

type PendingFile = {
  id: string;
  file: File;
};

export default function UploadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<PendingFile[]>([]);

  const uploadMutation = useMutation({
    mutationFn: ({ file, metadata }: { file: File; metadata: any }) =>
      uploadDocument(file, metadata),
    onSuccess: () => {
      // 성공 시 문서 목록 등 관련 쿼리를 무효화하여 다시 불러올 수 있습니다.
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error) => {
      // 에러 처리 로직 (예: 토스트 메시지 표시)
      console.error("Upload failed:", error.message);
    },
  });

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!files.length) {
      return;
    }

    const metadata = {
      dept_id: "some-dept-id", // 예시: 실제 값으로 교체 필요
      project_id: "some-project-id", // 예시: 실제 값으로 교체 필요
      user_id: "some-user-id", // 예시: 실제 값으로 교체 필요
    };

    try {
      // 모든 파일에 대한 업로드 프로미스를 생성합니다.
      const uploadPromises = files.map(({ file }) =>
        uploadMutation.mutateAsync({ file, metadata })
      );

      // 모든 프로미스가 완료될 때까지 기다립니다.
      await Promise.all(uploadPromises);

      // 모든 파일 업로드 성공 후 파일 목록 초기화
      setFiles([]);
    } catch (error) {
      console.error("An error occurred during file uploads:", error);
    }
  };

  return (
    <div className="min-h-screen pb-20 pt-12">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">문서 업로드</h1>
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
              <label className="block rounded-3xl border border-dashed border-slate-300  p-8 text-center text-slate-500 hover:border-blue-200 hover:bg-blue-50/30">
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

          <CardFooter className="flex flex-col gap-4 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <span>총 {files.length}개 파일</span>
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
              disabled={uploadMutation.isPending || !files.length}
              className="w-full gap-2 rounded-full py-3 text-base"
            >
              {uploadMutation.isPending ? "업로드 중..." : "업로드 요청 보내기"}
            </Button>
            {uploadMutation.isSuccess && (
              <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="size-4" />
                <span>
                  총 {files.length}개 파일의 업로드 및 인덱싱 요청이 성공적으로
                  완료되었습니다.
                </span>
              </div>
            )}
            {uploadMutation.isError && (
              <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="size-4" />
                <span>
                  업로드 중 오류가 발생했습니다: {uploadMutation.error.message}
                </span>
              </div>
            )}
            {!files.length && !uploadMutation.isSuccess && (
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
