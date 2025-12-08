import { API_BASE_URL } from "@/lib/constants";
//  [중요] Document와 DocumentStatus를 확실하게 import 해야 함
import type {
  RequestItem,
  RequestType,
  RequestStatus,
  Document,
  DocumentStatus,
} from "@/types/UserType";

// --------------------------------------------------------------------------
// 📝 타입 정의
// --------------------------------------------------------------------------

interface RequestListResponse {
  count: number;
  items: RequestItem[];
}

interface CreateRequestPayload {
  requester_id: number;
  project_id: number;
  request_type: RequestType;
  target_document_id: number | null;
  content: string;
}

// 상세 조회 응답 타입 (백엔드 Raw Data)
interface RequestDetailResponse {
  request: RequestItem;
  document: {
    id: number;
    user_id: number;
    dept_id: number;
    project_id: number;
    original_filename: string;
    stored_path: string;
    file_ext: string;
    file_size: number | null;
    status: string;
    category: string;
    version: string;
    created_at: string;
    updated_at: string;
  } | null;
}

export interface RequestDetailData {
  request: RequestItem;
  document: Document | null;
}

// --------------------------------------------------------------------------
// API 함수
// --------------------------------------------------------------------------

// 1. 요청 생성
export const createRequest = async (
  payload: CreateRequestPayload
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/requests/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "요청 생성 실패");
  }
  return response.json();
};

// 2. 요청 목록 조회
export const fetchRequests = async (
  status: RequestStatus | "" = "",
  deptId?: number
): Promise<RequestItem[]> => {
  let url = `${API_BASE_URL}/api/v1/admin/requests/`;
  const params = new URLSearchParams();

  if (status) params.append("status", status);
  if (deptId) {
    url = `${API_BASE_URL}/api/v1/admin/requests/by-dept/${deptId}`;
  }

  const queryString = params.toString();
  const finalUrl = queryString ? `${url}?${queryString}` : url;

  const response = await fetch(finalUrl);

  if (!response.ok) {
    console.warn("요청 목록 조회 실패");
    return [];
  }

  const data: RequestListResponse = await response.json();
  return data.items || [];
};

// 3. 상세 조회 (매핑 로직 포함)
export const fetchRequestDetail = async (
  reqId: number
): Promise<RequestDetailData> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/requests/${reqId}`
  );

  if (!response.ok) throw new Error("상세 정보 조회 실패");

  const data: RequestDetailResponse = await response.json();

  let mappedDoc: Document | null = null;

  if (data.document) {
    // 타입 충돌 방지를 위해 Document 타입 구조에 맞춰 생성
    mappedDoc = {
      id: data.document.id,
      userId: data.document.user_id,
      departmentId: data.document.dept_id,
      projectId: data.document.project_id,
      originalFilename: data.document.original_filename,
      storedPath: data.document.stored_path,
      fileExt: data.document.file_ext.replace(".", ""),
      fileSize: data.document.file_size || 0,
      category: "GENERAL",
      //  DocumentStatus로 타입 단언
      status: (data.document.status as DocumentStatus) || "COMPLETED",
      version: data.document.version,
      createdAt: data.document.created_at,
      updatedAt: data.document.updated_at,
      title: data.document.original_filename,
      content: "",
    };
  }

  return {
    request: data.request,
    document: mappedDoc,
  };
};

// 4. 승인
export const approveRequest = async (reqId: number): Promise<string> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/requests/${reqId}/approve`,
    {
      method: "POST",
    }
  );

  if (!response.ok) throw new Error("승인 처리 실패");
  return response.json();
};

// 5. 거절
export const rejectRequest = async (
  reqId: number,
  reason: string
): Promise<string> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/requests/${reqId}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }
  );

  if (!response.ok) throw new Error("거절 처리 실패");
  return response.json();
};
