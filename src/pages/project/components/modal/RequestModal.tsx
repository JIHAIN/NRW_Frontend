"use client";

import { useState } from "react";
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

// [변경] fetchDocuments(기존)와 uploadTempDocument(신규) import
import {
  fetchDocuments,
  uploadTempDocument,
} from "@/services/documents.service";
import { createRequest } from "@/services/request.service";
import type { RequestType } from "@/types/UserType";

interface RequestModalProps {
  projectId: number | null;
  projectName: string;
}

export function RequestModal({ projectId, projectName }: RequestModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 폼 상태
  const [requestType, setRequestType] = useState<RequestType>("CREATE");
  const [content, setContent] = useState("");
  const [targetDocId, setTargetDocId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 1. 문서 목록 조회 (기존 fetchDocuments 함수 사용)
  // 인자 순서 주의: 기존 함수가 (deptId, projectId) 순서인지 (projectId, deptId)인지 확인 필요
  // 상우님이 올린 파일 기준: fetchDocuments(deptId, projectId) 입니다.
  const { data: projectDocuments = [], isLoading } = useQuery({
    queryKey: ["projectDocuments", projectId],
    queryFn: () => fetchDocuments(1, projectId!), // deptId=1(임시), projectId
    enabled: !!projectId && open,
  });

  const handleSubmit = async () => {
    if (!content.trim()) return alert("요청 사유를 입력해주세요.");
    if (!projectId) return alert("프로젝트 정보가 없습니다.");
    if (requestType === "CREATE" && !selectedFile)
      return alert("파일을 선택해주세요.");
    if (requestType !== "CREATE" && !targetDocId)
      return alert("대상 문서를 선택해주세요.");

    try {
      setIsSubmitting(true);
      let finalTargetId = Number(targetDocId) || 0;

      // [Step 1] 신규 등록(CREATE) 시 -> '임시 업로드(uploadTempDocument)' 사용
      if (requestType === "CREATE" && selectedFile) {
        // 관리자용(uploadDocument)이 아니라, 새로 만든 사용자용(uploadTempDocument) 호출
        const uploadedId = await uploadTempDocument(selectedFile, 1, projectId);
        finalTargetId = Number(uploadedId);
      }

      // [Step 2] 요청 생성
      await createRequest({
        requester_id: 1, // [TODO] user_id
        project_id: projectId,
        request_type: requestType,
        target_document_id: finalTargetId,
        content: content,
      });

      alert("요청이 성공적으로 전송되었습니다.");
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setContent("");
    setTargetDocId("");
    setSelectedFile(null);
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
          className="gap-2 border rounded-2xl px-5 py-2 text-blue-900/70 hover:bg-blue-50"
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
          <div className="grid gap-2">
            <Label className="text-sm font-semibold">요청 종류</Label>
            <Select
              value={requestType}
              onValueChange={(v) => {
                setRequestType(v as RequestType);
                setTargetDocId("");
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

          {requestType === "CREATE" ? (
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">첨부 파일</Label>
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
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
                        : projectDocuments.length
                        ? "문서 선택"
                        : "문서 없음"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[200px]">
                  {projectDocuments.map((doc) => (
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

          <div className="grid gap-2">
            <Label className="text-sm font-semibold">요청 사유</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="상세 내용을 입력하세요."
              className="h-24 resize-none shadow-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 text-white hover:bg-blue-700 min-w-[100px]"
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
