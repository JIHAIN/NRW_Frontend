"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus, Loader2 } from "lucide-react";

// API & Store
import {
  fetchDocuments,
  uploadTempDocument,
} from "@/services/documents.service";
import { createRequest } from "@/services/request.service";
import { useAuthStore } from "@/store/authStore";
import type { RequestType, DocumentCategory } from "@/types/UserType";
import { CATEGORY_LABEL, CATEGORY_FILTERS } from "@/constants/projectConstants";
// [추가] 다이얼로그 스토어
import { useDialogStore } from "@/store/dialogStore";

interface RequestModalProps {
  projectId: number | undefined;
  projectName: string | undefined;
}

export function RequestModal({ projectId, projectName }: RequestModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuthStore();
  const dialog = useDialogStore(); // [추가] 다이얼로그 훅

  // 폼 상태
  const [requestType, setRequestType] = useState<RequestType>("CREATE");
  const [category, setCategory] = useState<DocumentCategory>("GENERAL");
  const [content, setContent] = useState("");
  const [targetDocId, setTargetDocId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 1. 문서 목록 조회 (수정/삭제용)
  const { data: projectDocuments = [], isLoading } = useQuery({
    queryKey: ["projectDocuments", projectId],
    queryFn: () => fetchDocuments(1, projectId!),
    enabled: !!projectId && open && requestType !== "CREATE",
  });

  // 카테고리 필터링된 문서 목록
  const filteredDocuments = useMemo(() => {
    if (!category) return projectDocuments;
    return projectDocuments.filter((doc) => doc.category === category);
  }, [projectDocuments, category]);

  const handleSubmit = async () => {
    // 1. 기본 유효성 검사 (alert -> dialog.alert)
    if (!content.trim()) {
      return dialog.alert({
        message: "요청 사유를 입력해주세요.",
        variant: "warning",
      });
    }
    if (!projectId) {
      return dialog.alert({
        message: "프로젝트 정보가 없습니다.",
        variant: "error",
      });
    }
    if (!user?.departmentId) {
      return dialog.alert({
        message: "부서 정보가 없습니다.",
        variant: "error",
      });
    }

    if (!user) {
      return dialog.alert({
        message: "로그인 정보가 없습니다.",
        variant: "error",
      });
    }

    // 2. 유형별 추가 검사 (alert -> dialog.alert)
    if (requestType === "CREATE" && !selectedFile) {
      return dialog.alert({
        message: "파일을 선택해주세요.",
        variant: "warning",
      });
    }
    if (requestType !== "CREATE" && !targetDocId) {
      return dialog.alert({
        message: "대상 문서를 선택해주세요.",
        variant: "warning",
      });
    }

    try {
      setIsSubmitting(true);
      let finalTargetId: number | null = null;

      // [Step 1] 신규 등록(CREATE)
      if (requestType === "CREATE" && selectedFile) {
        const uploadedId = await uploadTempDocument({
          file: selectedFile,
          deptId: user.departmentId,
          userId: user.id,
          projectId: projectId,
          category: category,
        });

        console.log("업로드된 ID:", uploadedId);

        finalTargetId = Number(uploadedId);
      } else {
        finalTargetId = Number(targetDocId);
      }

      if (!finalTargetId) {
        throw new Error("문서 ID를 확보하지 못했습니다.");
      }

      // [Step 2] 요청 생성
      await createRequest({
        requester_id: user.id,
        project_id: projectId,
        request_type: requestType,
        target_document_id: finalTargetId,
        content: content,
      });

      // alert -> await dialog.alert
      await dialog.alert({
        title: "요청 완료",
        message: "요청이 성공적으로 전송되었습니다.",
        variant: "success",
      });

      setOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      // alert -> dialog.alert
      dialog.alert({
        title: "오류 발생",
        message: "처리 중 오류가 발생했습니다.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setContent("");
    setTargetDocId("");
    setSelectedFile(null);
    setCategory("GENERAL");
    setRequestType("CREATE");
    setIsSubmitting(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          disabled={!projectId}
          className="gap-2 border rounded-2xl px-5 py-2 text-blue-900/70 hover:bg-blue-50 bg-white"
        >
          <Plus className="size-4 text-blue-500" /> 문서 변경 요청
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>문서 변경 요청</DialogTitle>
          <DialogDescription>
            <span className="font-bold text-blue-600">{projectName}</span> 작업
            요청
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* 1. 요청 종류 */}
          <div className="grid gap-2">
            <Label className="text-sm font-semibold">요청 종류</Label>
            <Select
              value={requestType}
              onValueChange={(v) => {
                setRequestType(v as RequestType);
                setTargetDocId("");
                setSelectedFile(null);
              }}
            >
              <SelectTrigger className="shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="CREATE">신규 등록</SelectItem>
                <SelectItem value="UPDATE">문서 수정/교체</SelectItem>
                <SelectItem value="DELETE">문서 삭제</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 2. 카테고리 선택 */}
          <div className="grid gap-2 ">
            <Label className="text-sm font-semibold flex gap-4 ">
              문서 분류
              <span className="text-xs font-normal text-gray-400">
                {requestType === "CREATE"
                  ? "* 등록될 문서의 카테고리입니다."
                  : "* 목록을 필터링합니다."}
              </span>
            </Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v as DocumentCategory);
                setTargetDocId("");
              }}
            >
              <SelectTrigger className="bg-white shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {CATEGORY_FILTERS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABEL[cat] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. 파일 업로드 or 문서 선택 */}
          {requestType === "CREATE" ? (
            <div className="grid gap-2 ">
              <Label className="text-sm font-semibold">첨부 파일</Label>
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="border-blue-200 shadow-sm cursor-pointer"
              />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">대상 문서</Label>
              <Select value={targetDocId} onValueChange={setTargetDocId}>
                <SelectTrigger disabled={isLoading} className="shadow-sm">
                  <SelectValue
                    placeholder={
                      isLoading
                        ? "로딩 중..."
                        : filteredDocuments.length
                        ? "문서 선택"
                        : "해당 분류의 문서 없음"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[200px]">
                  {filteredDocuments.map((doc) => (
                    <SelectItem key={doc.id} value={String(doc.id)}>
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-gray-400" />
                        <span className="truncate max-w-[280px]">
                          {doc.originalFilename}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 4. 사유 입력 */}
          <div className="grid gap-2">
            <Label className="text-sm font-semibold">요청 사유</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="요청에 대한 상세 내용을 입력하세요."
              className="h-24 resize-none border-blue-200 shadow-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="point-hover border shadow-sm border-blue-200"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 text-white shadow-sm hover:bg-blue-700 min-w-[100px] cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "요청 보내기"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
