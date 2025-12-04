import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar,
  Loader2,
  AlertCircle,
  Hash,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  fetchRequests,
  approveRequest,
  rejectRequest,
} from "@/services/request.service";
import type { RequestItem, RequestStatus } from "@/types/UserType";
import { useAuthStore } from "@/store/authStore";
import { RequestDetailModal } from "./RequestDetailModal";

const TABS: { label: string; value: RequestStatus | "" }[] = [
  { label: "대기중", value: "PENDING" },
  { label: "승인됨", value: "APPROVED" },
  { label: "반려됨", value: "REJECTED" },
  { label: "전체 보기", value: "" },
];

import { useDocumentStore } from "@/store/documentStore";

export default function RequestAdminPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { startRequestSSE } = useDocumentStore();

  const [currentTab, setCurrentTab] = useState<RequestStatus | "">("PENDING");

  // 반려 관련 상태
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // 상세 모달 관련 상태: ID 대신 객체 전체를 저장
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(
    null
  );

  // 1. 요청 목록 조회
  const { data: requests = [], isLoading } = useQuery<RequestItem[]>({
    queryKey: ["requests", currentTab, user?.departmentId],
    queryFn: () =>
      fetchRequests(
        currentTab,
        user?.role === "SUPER_ADMIN" ? undefined : user?.departmentId
      ),
    enabled: !!user,
  });

  // 2. 승인 Mutation
  const approveMutation = useMutation({
    mutationFn: approveRequest,
    onSuccess: (_, reqId) => {
      // reqId: 승인한 요청 ID
      alert("승인 요청이 전송되었습니다. 백그라운드에서 처리됩니다.");

      // ★ 여기서 스토어 액션 호출!
      // (문서 이름을 알기 위해 requests 목록에서 찾거나, mutation 변수로 받아야 함)
      const targetReq = requests.find((r) => r.id === reqId);
      const docName = targetReq?.document_name || `요청 #${reqId}`;

      startRequestSSE(reqId, docName); // SSE 시작 및 상태창 표시

      queryClient.invalidateQueries({ queryKey: ["requests"] });
      setDetailModalOpen(false);
    },
    onError: () => alert("승인 실패"),
  });

  // 3. 반려 Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectRequest(id, reason),
    // 여기도 variables를 받아옵니다. variables는 { id, reason } 객체입니다.
    onSuccess: (_, variables) => {
      alert("반려되었습니다.");
      setRejectModalOpen(false);
      setRejectReason("");

      // 1. 목록 갱신
      queryClient.invalidateQueries({ queryKey: ["requests"] });

      // 2. 핵심: 방금 반려한 그 디테일 데이터도 갱신 (캐시 삭제)
      queryClient.invalidateQueries({
        queryKey: ["requestDetail", variables.id],
      });

      setDetailModalOpen(false);
    },
    onError: () => alert("반려 실패"),
  });

  // 핸들러
  const handleApprove = (id: number) => {
    if (confirm("승인하시겠습니까?")) approveMutation.mutate(id);
  };

  const handleRejectClick = (id: number) => {
    setSelectedReqId(id);
    setRejectModalOpen(true);
  };

  const submitReject = () => {
    if (selectedReqId && rejectReason.trim()) {
      rejectMutation.mutate({ id: selectedReqId, reason: rejectReason });
    }
  };

  // 상세 모달에서 사용하는 핸들러
  const handleDetailApprove = (id: number) => handleApprove(id);
  const handleDetailReject = (id: number) => {
    setSelectedReqId(id);
    setRejectModalOpen(true);
  };

  // 수정됨: ID 대신 객체 전체를 받음
  const handleRowClick = (req: RequestItem) => {
    setSelectedRequest(req);
    setDetailModalOpen(true);
  };

  // 상태 뱃지 (리스트용)
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold border border-yellow-200">
            대기중
          </span>
        );
      case "APPROVED":
        return (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">
            승인됨
          </span>
        );
      case "REJECTED":
        return (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">
            반려됨
          </span>
        );
      default:
        return null;
    }
  };

  // 타입 뱃지 (리스트용)
  const renderTypeBadge = (status: string) => {
    switch (status) {
      case "CREATE":
        return (
          <span className="bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-200">
            문서 추가
          </span>
        );
      case "UPDATE":
        return (
          <span className="bg-green-200 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">
            문서 수정
          </span>
        );
      case "DELETE":
        return (
          <span className="bg-red-200 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">
            문서 삭제
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 page-layout p-8">
      {/* ... (상단 헤더 및 탭 부분은 동일) ... */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">요청 승인 관리</h1>
          <Button
            variant="ghost"
            size="sm"
            className="border border-blue-100 point-hover"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["requests"] })
            }
          >
            새로고침
          </Button>
        </div>
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setCurrentTab(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                currentTab === tab.value
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full text-slate-400 gap-2">
            <Loader2 className="animate-spin" /> 로딩 중...
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-slate-400 gap-2">
            <FileText size={48} className="opacity-20" />
            <p>요청 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((req) => (
              <div
                key={req.id}
                onClick={() => handleRowClick(req)} // 수정됨: 객체 전체 전달
                className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-4 cursor-pointer group"
              >
                {/* ... (리스트 아이템 렌더링 부분은 동일) ... */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-4">
                    {renderTypeBadge(req.request_type)}
                    {renderStatusBadge(req.status)}

                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <Calendar size={12} />{" "}
                      {new Date(req.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-medium flex items-center gap-2 ">
                      <span className=" text-slate-600 text-sm  bg-slate-100 px-2 py-0.5 rounded">
                        {req.document_name || "-"}
                      </span>
                    </h3>
                    <div className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded border border-slate-100">
                      <span className="font-bold text-slate-700 block mb-1 text-xs">
                        요청 사유
                      </span>
                      {req.content || "내용 없음"}
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 flex gap-4 pt-1 items-center">
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <User size={12} /> {req.user_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash size={12} />
                      {req.project_name}
                    </span>
                  </div>
                </div>

                {req.status === "PENDING" && (
                  <div
                    className="flex md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4 min-w-[120px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      onClick={() => handleApprove(req.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full gap-2 shadow-sm"
                    >
                      <CheckCircle size={16} /> 승인
                    </Button>
                    <Button
                      onClick={() => handleRejectClick(req.id)}
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 border-red-200 w-full gap-2"
                    >
                      <XCircle size={16} /> 반려
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 상세 정보 모달 */}
      <RequestDetailModal
        baseInfo={selectedRequest} // 수정됨: 객체 전체 전달
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onApprove={handleDetailApprove}
        onReject={handleDetailReject}
      />

      {/* 반려 사유 입력 모달 (동일) */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="bg-white">
          {/* ... (반려 모달 내용 동일) ... */}
          <DialogHeader>
            <DialogTitle className="text-red-600 flex gap-2 ">
              <AlertCircle size={20} /> 요청 반려
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="반려 사유 입력"
              className="resize-none h-52 border-gray-300  "
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRejectModalOpen(false)}
              className="border border-gray-300 cursor-pointer hover:bg-gray-200"
            >
              취소
            </Button>
            <Button
              onClick={submitReject}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              반려 확정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
