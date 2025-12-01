import { API_BASE_URL } from "@/lib/constants";
import type { Document, DocumentStatus } from "@/types/UserType";

// --------------------------------------------------------------------------
// 📝 타입 정의
// --------------------------------------------------------------------------

// 백엔드에서 오는 실제 문서 데이터 모양
export interface BackendDocument {
  id: number;
  user_id: number;
  dept_id: number;
  project_id: number;

  original_filename: string;
  stored_path: string;
  file_ext: string;
  file_size: number | null;
  status: string;

  created_at: string;
  updated_at: string;
  version: string;
}

// 문서 상세 내용 (content)
interface DocumentContentResponse {
  doc_id: string;
  total_chunks: number;
  content: string;
}

export interface UploadMetadata {
  dept_id: number;
  project_id: number;
  user_id: number;
  category?: string;
}

// --------------------------------------------------------------------------
// 🔄 데이터 변환 헬퍼
// --------------------------------------------------------------------------
const mapApiToDocument = (data: BackendDocument): Document => {
  return {
    id: data.id,
    userId: data.user_id,
    departmentId: data.dept_id,
    projectId: data.project_id,

    // ✨ [수정 1] title 필드 추가 (파일명 사용)
    title: data.original_filename,

    // ✨ [수정 2] content 필드 추가 (목록에서는 빈 값, 상세 조회 시 채움)
    content: "",

    originalFilename: data.original_filename,
    storedPath: data.stored_path,
    fileExt: data.file_ext.replace(".", ""),
    fileSize: data.file_size || 0,

    category: "GENERAL",

    // string -> DocumentStatus로 타입 단언
    status: (data.status as DocumentStatus) || "COMPLETED",

    version: data.version,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

// --------------------------------------------------------------------------
// 1. 문서 목록 조회
// --------------------------------------------------------------------------
export const fetchDocuments = async (
  deptId: number,
  projectId: number
): Promise<Document[]> => {
  const params = new URLSearchParams();
  if (deptId) params.append("dept_id", String(deptId));
  if (projectId) params.append("project_id", String(projectId));

  const response = await fetch(
    `${API_BASE_URL}/api/v1/documents/?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }

  const list = (await response.json()) as BackendDocument[];

  return list.map(mapApiToDocument);
};

// --------------------------------------------------------------------------
// 2. 문서 내용 조회
// --------------------------------------------------------------------------
export const fetchDocumentContent = async (docId: number): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/${docId}`);

  if (!response.ok) throw new Error("Failed to fetch document content");

  const data = (await response.json()) as DocumentContentResponse;
  return data.content;
};

// --------------------------------------------------------------------------
// 3. 문서 업로드
// --------------------------------------------------------------------------
export const uploadDocument = async (
  file: File,
  metadata: UploadMetadata,
  onProgress?: (percent: number) => void
): Promise<BackendDocument> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_id", String(metadata.user_id));
  formData.append("dept_id", String(metadata.dept_id));
  formData.append("project_id", String(metadata.project_id));

  if (metadata.category) {
    formData.append("category", metadata.category);
  }

  formData.append("version", "1.0");
  formData.append("upload_date", new Date().toISOString());

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/v1/parsing/upload-and-parse/`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.response) as BackendDocument;
          resolve(response);
        } catch {
          reject(new Error("Invalid JSON response"));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.response) as { detail?: string };
          reject(new Error(errRes.detail || xhr.statusText));
        } catch {
          reject(new Error(xhr.statusText));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network Error"));
    xhr.send(formData);
  });
};

// --------------------------------------------------------------------------
// 4. 문서 다운로드
// --------------------------------------------------------------------------
export const downloadDocument = async (
  docId: number,
  filename: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/documents/download/${docId}`
  );

  if (!response.ok) throw new Error("Download failed");

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// --------------------------------------------------------------------------
// 5. [신규] 일반 사용자용 임시 업로드 (승인 대기용)
// POST /async/upload
// --------------------------------------------------------------------------
export const uploadTempDocument = async (
  file: File,
  deptId: number,
  projectId: number
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  // [주의] user_id는 실제 인증된 유저 ID를 넣어야 함 (지금은 1로 하드코딩 or 인자로 받기)
  formData.append("user_id", "1");
  formData.append("dept_id", String(deptId));
  formData.append("project_id", String(projectId));
  formData.append("category", "GENERAL"); // 기본 카테고리
  formData.append("version", "1.0");

  const response = await fetch(`${API_BASE_URL}/async/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "임시 업로드 실패");
  }

  // API 명세상 Response가 "string" (문서 ID)일 것으로 추정
  return response.json();
};
