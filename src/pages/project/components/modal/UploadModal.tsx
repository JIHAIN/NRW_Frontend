"use client";

import { useState } from "react";
import { Upload, X, FileText, Plus } from "lucide-react";
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

// 스토어 사용
import { useDocumentStore } from "@/store/documentStore";
import type { UploadMetadata } from "@/services/documents.service";
import { CATEGORY_LABEL, CATEGORY_FILTERS } from "@/constants/projectConstants";
import type { DocumentCategory } from "@/types/UserType";

interface PendingFile {
  id: string;
  file: File;
}

interface UploadModalProps {
  departmentId?: number;
  projectId?: number;
  projectName: string;
  disabled?: boolean;
}

export function UploadModal({
  departmentId = 1,
  projectId = 1,
  projectName,
  disabled,
}: UploadModalProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [category, setCategory] = useState<DocumentCategory>("GENERAL");

  //  스토어 액션 가져오기
  const { uploadFile } = useDocumentStore();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files;
    if (!selected?.length) return;
    const nextFiles = Array.from(selected).map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      file,
    }));
    setFiles((prev) => [...prev, ...nextFiles]);
    event.target.value = "";
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
  };

  //  제출 버튼 (핵심 수정)
  const handleSubmit = () => {
    if (!files.length) return;

    // 1. 메타데이터 준비
    const metadata: UploadMetadata = {
      user_id: 1,
      dept_id: departmentId,
      project_id: projectId,
      category: category,
    };

    // 2. 스토어에 "이거 처리해줘!" 하고 던짐 (await 안 함)
    files.forEach(({ file }) => {
      uploadFile(file, metadata).catch((err) => console.error(err));
    });

    // 3. 묻지도 따지지도 않고 팝업 닫기 (백그라운드에서 처리됨)
    setOpen(false);
    setFiles([]);
  };

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) setFiles([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled}
          className="gap-2 border rounded-2xl px-5 py-2 text-blue-900/70 point-hover bg-white hover:bg-gray-50"
        >
          <Plus className="size-4 text-blue-500" />
          문서 업로드
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle>문서 업로드</DialogTitle>
          <DialogDescription>
            <span className="font-bold text-blue-400">{projectName}</span>에
            문서를 추가합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 카테고리 선택 */}
          <div className="grid gap-2">
            <Label>문서 분류</Label>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as DocumentCategory)}
            >
              <SelectTrigger className="bg-white cursor-pointer border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {(CATEGORY_FILTERS || ["GENERAL"]).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABEL?.[cat] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 파일 드롭존 */}
          <div className="grid gap-2">
            <Label>파일 선택</Label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">
                  클릭 또는 드래그 앤 드롭
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

          {/* 파일 목록 */}
          {files.length > 0 && (
            <div className="grid gap-2 max-h-[150px] overflow-y-auto pr-2">
              {files.map(({ id, file }) => (
                <div
                  key={id}
                  className="flex items-center justify-between p-2 bg-blue-50/50 rounded border border-blue-100 text-sm"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate max-w-[300px]">{file.name}</span>
                  </div>
                  <button onClick={() => handleRemoveFile(id)}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex sm:justify-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!files.length}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            업로드 시작
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
