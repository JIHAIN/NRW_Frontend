"use client";

import { useState, useMemo } from "react";
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
import { FileText, Plus } from "lucide-react";

// 타입 임포트
import type { RequestType, Document } from "@/types/UserType";

// 🧪 [임시] 문서 선택용 Mock Data (ProjectTable에 있는 것과 동일하게 맞춤)
// 나중에는 documentStore에서 가져오거나 props로 받아야 합니다.
const MOCK_DOCS: Partial<Document>[] = [
  { id: 1, projectId: 1, originalFilename: "AI_지식관리_기획서_v1.0.pdf" },
  { id: 2, projectId: 1, originalFilename: "API_명세서_최종.xlsx" },
  { id: 3, projectId: 2, originalFilename: "클라우드_전환_비용분석.pptx" },
  { id: 4, projectId: 6, originalFilename: "좌석배치도_2024.pdf" },
];

interface RequestModalProps {
  projectId: number | null; // 현재 선택된 프로젝트 ID (문서 필터링용)
  projectName: string; // 모달 제목용
}

export function RequestModal({ projectId, projectName }: RequestModalProps) {
  const [open, setOpen] = useState(false);

  // 폼 상태 관리
  const [requestType, setRequestType] = useState<RequestType>("CREATE");
  const [content, setContent] = useState("");
  const [targetDocId, setTargetDocId] = useState<string>(""); // 수정/삭제 대상
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // 신규 등록 파일

  //  현재 프로젝트에 속한 문서만 필터링 (수정/삭제 선택용)
  const projectDocuments = useMemo(() => {
    if (!projectId) return [];
    return MOCK_DOCS.filter((doc) => doc.projectId === projectId);
  }, [projectId]);

  const handleSubmit = () => {
    // 유효성 검사
    if (!content.trim()) return alert("요청 사유를 입력해주세요.");
    if (requestType === "CREATE" && !selectedFile)
      return alert("첨부할 파일을 선택해주세요.");
    if (requestType !== "CREATE" && !targetDocId)
      return alert("대상 문서를 선택해주세요.");

    // ✨ [TODO] 나중에 여기서 백엔드 API (/api/requests) 호출
    const payload = {
      projectId,
      type: requestType,
      content,
      file: selectedFile,
      targetDocumentId: targetDocId,
    };

    console.log("🚀 요청 전송:", payload);

    alert("관리자에게 요청이 전송되었습니다.");
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setContent("");
    setTargetDocId("");
    setSelectedFile(null);
    setRequestType("CREATE");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      {/* 트리거 버튼 */}
      <DialogTrigger asChild>
        <Button
          disabled={!projectId} // 프로젝트 선택 안 하면 비활성화
          className="gap-2 border rounded-2xl px-5 py-2 text-blue-900/70 point-hover"
        >
          <Plus className="size-4 text-blue-500" />
          문서 변경 요청
        </Button>
      </DialogTrigger>

      {/* 모달 내용 */}
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>문서 변경 요청</DialogTitle>
          <DialogDescription>
            <span className="font-bold text-blue-600">
              {projectName || "프로젝트 미선택"}
            </span>
            에 대한 작업을 관리자에게 요청합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* 1. 요청 종류 선택 */}
          <div className="grid gap-2">
            <Label className="text-sm font-semibold">요청 종류</Label>
            <Select
              value={requestType}
              onValueChange={(val) => {
                setRequestType(val as RequestType);
                setTargetDocId(""); // 타입 바뀌면 대상 문서 초기화
              }}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="CREATE">➕ 신규 등록 요청</SelectItem>
                <SelectItem value="UPDATE">
                  ✏️ 기존 문서 수정/교체 요청
                </SelectItem>
                <SelectItem value="DELETE">🗑️ 문서 삭제 요청</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 2. 동적 UI: 파일 업로드 vs 문서 선택 */}
          {requestType === "CREATE" ? (
            // [CASE A] 신규 등록: 파일 업로드 UI
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">첨부 파일</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  className="cursor-pointer bg-gray-50"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
              <p className="text-xs text-gray-500">
                등록할 문서를 첨부해주세요. (PDF, XLSX, HWP 등)
              </p>
            </div>
          ) : (
            // [CASE B] 수정/삭제: 대상 문서 선택 UI
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">
                {requestType === "UPDATE"
                  ? "수정할 문서 선택"
                  : "삭제할 문서 선택"}
              </Label>
              <Select value={targetDocId} onValueChange={setTargetDocId}>
                <SelectTrigger
                  className={
                    !projectDocuments.length ? "bg-gray-100" : "bg-white"
                  }
                >
                  <SelectValue
                    placeholder={
                      projectDocuments.length
                        ? "문서 선택..."
                        : "해당 프로젝트에 문서가 없습니다."
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {projectDocuments.map((doc) => (
                    <SelectItem key={doc.id} value={String(doc.id)}>
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-gray-400" />
                        {doc.originalFilename}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 3. 요청 사유 입력 (공통) */}
          <div className="grid gap-2">
            <Label className="text-sm font-semibold">
              요청 사유 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                requestType === "CREATE"
                  ? "이 문서의 용도와 설명을 적어주세요."
                  : "변경 또는 삭제가 필요한 사유를 상세히 적어주세요."
              }
              className="h-24 resize-none bg-white"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            요청 보내기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
