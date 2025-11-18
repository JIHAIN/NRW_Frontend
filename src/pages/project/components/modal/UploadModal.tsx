"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// API 및 Store 임포트
import { uploadDocument } from "@/services/documents.service";
import type { DocumentCategory } from "@/types/UserType";
import { CATEGORY_LABEL, CATEGORY_FILTERS } from "@/constants/projectConstants";

// ✨ [수정] API 명세에 맞춰 dept_id로 수정
interface UploadMetadata {
  dept_id: number; // departmentId -> dept_id
  project_id: number;
  user_id: number;
  category?: string;
}

type PendingFile = {
  id: string;
  file: File;
};

interface UploadModalProps {
  departmentId: number | undefined;
  projectId: number | undefined;
  projectName: string;
  disabled?: boolean;
}

export function UploadModal({
  // departmentId,
  // projectId,
  projectName,
  disabled,
}: UploadModalProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [category, setCategory] = useState<DocumentCategory>("GENERAL");

  // 업로드 성공 시 메시지에 표시할 파일 개수 저장용
  const [lastUploadedCount, setLastUploadedCount] = useState(0);

  const queryClient = useQueryClient();

  // 업로드 뮤테이션
  const uploadMutation = useMutation({
    mutationFn: ({
      file,
      metadata,
    }: {
      file: File;
      metadata: UploadMetadata;
    }) => uploadDocument(file, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  // 파일 선택 핸들러
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (uploadMutation.isSuccess || uploadMutation.isError) {
      uploadMutation.reset();
    }

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
        if (!existingIds.has(entry.id)) merged.push(entry);
      });
      return merged;
    });

    event.target.value = "";
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
    if (uploadMutation.isSuccess || uploadMutation.isError) {
      uploadMutation.reset();
    }
  };

  // ✨ 제출 핸들러
  const handleSubmit = async () => {
    if (!files.length) return;

    // Props로 받은 값이 유효한지 확인 (데모용 주석 해제 시 사용)
    /*
    if (!projectId || !departmentId) {
      console.warn("프로젝트 또는 부서 ID가 없습니다.");
      return;
    }
    */

    setLastUploadedCount(files.length);

    // 🧪 [데모용] 하드코딩된 메타데이터
    // ✨ 여기서 departmentId -> dept_id 로 수정
    const DEMO_METADATA: UploadMetadata = {
      user_id: 2,
      dept_id: 1, // ✨ 수정됨
      project_id: 1,
      category: category,
    };

    /* [Original Code - 나중에 복구 시 참조]
    const metadata: UploadMetadata = {
      user_id: 1, // 실제 유저 ID
      dept_id: departmentId!, // Props에서 받은 departmentId를 dept_id에 할당
      project_id: projectId!,
      category: category,
    };
    */

    try {
      const uploadPromises = files.map(({ file }) =>
        uploadMutation.mutateAsync({ file, metadata: DEMO_METADATA })
      );

      await Promise.all(uploadPromises);

      // 성공 시 파일 목록 비우기
      setFiles([]);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setFiles([]);
      uploadMutation.reset();
      setLastUploadedCount(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled}
          className="gap-2 border rounded-2xl px-5 py-2 text-blue-900/70 point-hover"
        >
          <Plus className="size-4 text-blue-500" />
          문서 업로드
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle>문서 업로드</DialogTitle>
          <DialogDescription className="text-[0.95rem]">
            <span className="font-bold text-blue-400">{projectName}</span>
            프로젝트에 문서를 추가합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 1. 카테고리 선택 */}
          <div className="grid gap-2">
            <Label>문서 분류</Label>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as DocumentCategory)}
            >
              <SelectTrigger className="bg-white cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {CATEGORY_FILTERS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABEL[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. 파일 드롭존 */}
          <div className="grid gap-2">
            <Label>파일 선택</Label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-blue-400">
                    클릭하여 업로드
                  </span>{" "}
                  또는 드래그 앤 드롭
                </p>
                <p className="text-xs text-gray-500">
                  HWP, HWPX, PDF (최대 200MB)
                </p>
              </div>
              <Input
                type="file"
                className="hidden"
                multiple
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {/* 3. 선택된 파일 목록 */}
          {files.length > 0 && (
            <div className="grid gap-2 max-h-[150px] overflow-y-auto pr-2">
              {files.map(({ id, file }) => (
                <div
                  key={id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate max-w-[300px]">{file.name}</span>
                    <span className="text-xs text-gray-400">
                      ({Math.round(file.size / 1024)}KB)
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={16} className="point-hover rounded-full" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 결과 메시지 표시 영역 */}
        <div className="w-full">
          {uploadMutation.isSuccess && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="size-5 shrink-0" />
              <span>
                총 <strong>{lastUploadedCount}</strong>개 파일의 업로드가
                성공적으로 완료되었습니다.
              </span>
            </div>
          )}

          {uploadMutation.isError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="size-5 shrink-0" />
              <span className="break-all">
                업로드 실패:{" "}
                {uploadMutation.error.message ||
                  "알 수 없는 오류가 발생했습니다."}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex flex-col sm:justify-center gap-4">
          <div className="flex w-full justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="point-hover"
            >
              {uploadMutation.isSuccess ? "닫기" : "취소"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!files.length || uploadMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white "></div>
                  업로드 중...
                </>
              ) : (
                "업로드 하기"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
