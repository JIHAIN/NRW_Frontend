"use client";

import { useState, useMemo, useEffect } from "react";
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
import { FileText, Plus, Loader2, CheckCircle2, Search } from "lucide-react"; // 아이콘 추가

// API & Store
import {
  fetchDocuments,
  uploadTempDocument,
} from "@/services/documents.service";
import { createRequest } from "@/services/request.service";
import { useAuthStore } from "@/store/authStore";
import type { RequestType, DocumentCategory } from "@/types/UserType";
import { CATEGORY_LABEL, CATEGORY_FILTERS } from "@/constants/projectConstants";
import { useDialogStore } from "@/store/dialogStore";

interface RequestModalProps {
  projectId: number | undefined;
  projectName: string | undefined;
  departmentId: number | undefined; // [수정] 부서 ID Props 추가
}

export function RequestModal({
  projectId,
  projectName,
  departmentId, // [수정] 받아서 사용
}: RequestModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuthStore();
  const dialog = useDialogStore();

  // 폼 상태
  const [requestType, setRequestType] = useState<RequestType>("CREATE");

  // [수정] 카테고리 상태: "ALL"을 포함하기 위해 타입을 넓힘
  const [category, setCategory] = useState<DocumentCategory | "ALL">("GENERAL");

  const [content, setContent] = useState("");
  const [targetDocId, setTargetDocId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // [수정] 요청 타입이 바뀔 때 카테고리 기본값 설정
  useEffect(() => {
    if (requestType === "CREATE") {
      setCategory("GENERAL"); // 생성 시엔 구체적 카테고리 필요
    } else {
      setCategory("ALL"); // 수정/삭제 시엔 전체 조회가 기본
    }
    setTargetDocId("");
    setSelectedFile(null);
  }, [requestType]);

  // 1. 문서 목록 조회 (수정/삭제용)
  const { data: projectDocuments = [], isLoading } = useQuery({
    queryKey: ["projectDocuments", projectId, departmentId], // 키에 departmentId 추가
    // [수정] 하드코딩된 1 대신 props로 받은 departmentId 사용
    queryFn: () => fetchDocuments(departmentId!, projectId!),
    enabled: !!projectId && !!departmentId && open && requestType !== "CREATE",
  });

  // 카테고리 필터링된 문서 목록
  const filteredDocuments = useMemo(() => {
    if (category === "ALL") return projectDocuments; // 전체 분류일 경우 전체 반환
    return projectDocuments.filter((doc) => doc.category === category);
  }, [projectDocuments, category]);

  const handleSubmit = async () => {
    // ... (기본 유효성 검사 로직 동일)
    if (!content.trim()) {
      return dialog.alert({
        message: "요청 사유를 입력해주세요.",
        variant: "warning",
      });
    }
    if (!projectId || !departmentId) {
      // departmentId 체크 추가
      return dialog.alert({
        message: "프로젝트 또는 부서 정보가 없습니다.",
        variant: "error",
      });
    }
    if (!user) {
      return dialog.alert({
        message: "로그인 정보가 없습니다.",
        variant: "error",
      });
    }

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
        // CREATE 일때는 category가 "ALL"일 수 없으므로 타입 단언
        const uploadCategory = category === "ALL" ? "GENERAL" : category;

        const uploadedId = await uploadTempDocument({
          file: selectedFile,
          deptId: departmentId, // user.departmentId 대신 현재 선택된 컨텍스트 사용 (권장)
          userId: user.id,
          projectId: projectId,
          category: uploadCategory,
        });
        finalTargetId = Number(uploadedId);
      } else {
        finalTargetId = Number(targetDocId);
      }

      if (!finalTargetId) throw new Error("문서 ID를 확보하지 못했습니다.");

      // [Step 2] 요청 생성
      await createRequest({
        requester_id: user.id,
        project_id: projectId,
        request_type: requestType,
        target_document_id: finalTargetId,
        content: content,
      });

      await dialog.alert({
        title: "요청 완료",
        message: "요청이 성공적으로 전송되었습니다.",
        variant: "success",
      });

      setOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
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
    setCategory("GENERAL"); // 모달 닫으면 초기화
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

      <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>문서 변경 요청</DialogTitle>
          <DialogDescription>
            <span className="font-bold text-blue-600">{projectName}</span> 작업
            요청
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 1. 요청 종류 */}
          <div className="grid gap-2">
            <Label className="text-sm font-semibold">요청 종류</Label>
            <Select
              value={requestType}
              onValueChange={(v) => setRequestType(v as RequestType)}
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
          <div className="grid gap-2">
            <Label className="text-sm font-semibold flex gap-4 items-center">
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
                setCategory(v as DocumentCategory | "ALL");
                setTargetDocId("");
              }}
            >
              <SelectTrigger className="bg-white shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {/* [수정] 수정/삭제 모드일 때만 '전체 분류' 옵션 노출 */}
                {requestType !== "CREATE" && (
                  <SelectItem
                    value="ALL"
                    className="font-semibold text-blue-600"
                  >
                    전체 분류
                  </SelectItem>
                )}
                {CATEGORY_FILTERS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABEL[cat] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. 파일 업로드 or 문서 선택 UI 개선 */}
          {requestType === "CREATE" ? (
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">첨부 파일</Label>
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 flex flex-col items-center justify-center bg-blue-50/30 hover:bg-blue-50/50 transition-colors cursor-pointer relative">
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {selectedFile ? (
                  <div className="flex items-center gap-2 text-blue-700 font-medium">
                    <FileText size={24} />
                    {selectedFile.name}
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Plus size={24} className="mx-auto mb-2 text-blue-300" />
                    <p className="text-sm">클릭하여 파일을 업로드하세요</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">대상 문서 선택</Label>
              {/* [수정] 드롭다운 대신 스크롤 가능한 리스트 박스로 변경 */}
              <div className="border border-blue-200 rounded-md h-60 overflow-y-auto p-1 space-y-1 custom-scrollbar shadow-inner">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center text-gray-400 gap-2">
                    <Loader2 className="animate-spin size-5" /> 문서를 불러오는
                    중...
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Search className="size-8 opacity-20" />
                    <span className="text-sm">
                      해당 분류의 문서가 없습니다.
                    </span>
                  </div>
                ) : (
                  filteredDocuments.map((doc) => {
                    const isSelected = targetDocId === String(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setTargetDocId(String(doc.id))}
                        className={`
                          flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all 
                          ${
                            isSelected
                              ? "bg-blue-100 border-blue-300 shadow-sm"
                              : "bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm hover:bg-blue-50"
                          }
                        `}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div
                            className={`p-2 rounded-md ${
                              isSelected
                                ? "bg-blue-200 text-blue-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <FileText size={16} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span
                              className={`text-sm truncate font-medium ${
                                isSelected ? "text-blue-900" : "text-slate-700"
                              }`}
                            >
                              {doc.originalFilename}
                            </span>
                            <span className="text-xs text-gray-400 flex gap-2">
                              <span>{CATEGORY_LABEL[doc.category]}</span>
                              <span>•</span>
                              <span>
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </span>
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="text-blue-600 size-5 shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 4. 사유 입력 */}
          <div className="grid gap-2">
            <Label className="text-sm font-semibold">요청 사유</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="요청에 대한 상세 내용을 입력하세요."
              className="h-24 resize-none border-blue-200 shadow-sm focus-visible:ring-blue-500"
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
