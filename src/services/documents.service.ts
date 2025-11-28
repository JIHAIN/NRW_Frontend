import { API_BASE_URL } from "@/lib/constants";
import type { Document } from "@/types/UserType";

// --------------------------------------------------------------------------
// 📝 타입 정의 (기존 유지)
// --------------------------------------------------------------------------
export interface BackendDocument {
  id: number;
  external_doc_id: string;
  user_id: number;
  dept_id: number;
  project_id: number;
  category: string;
  version: string;
  original_filename: string;
  stored_path: string;
  file_ext: string;
  file_size: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

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
// 🔄 데이터 변환 헬퍼 (기존 유지)
// --------------------------------------------------------------------------
const mapApiToDocument = (data: BackendDocument): Document => {
  return {
    id: data.id,
    userId: data.user_id,
    departmentId: data.dept_id,
    projectId: data.project_id,
    title: data.original_filename || data.external_doc_id,
    originalFilename: data.original_filename || data.external_doc_id,
    storedPath: data.stored_path,
    fileExt: data.file_ext || "unknown",
    fileSize: data.file_size || 0,
    category: (data.category as Document["category"]) || "GENERAL",
    status: (data.status as Document["status"]) || "PARSING",
    version: data.version || "1.0",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    content: "",
  };
};

// --------------------------------------------------------------------------
// 1. 문서 목록 조회 (기존 유지)
// --------------------------------------------------------------------------
export const fetchDocuments = async (
  deptId: number,
  projectId: number
): Promise<Document[]> => {
  const params = new URLSearchParams();
  params.append("dept_id", String(deptId));
  params.append("project_id", String(projectId));

  const response = await fetch(
    `${API_BASE_URL}/api/v1/documents/?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.status}`);
  }

  const list = (await response.json()) as BackendDocument[];
  return list.map((item) => mapApiToDocument(item));
};

// --------------------------------------------------------------------------
// 2. 문서 내용 조회 (기존 유지)
// --------------------------------------------------------------------------
export const fetchDocumentContent = async (
  docId: string | number
): Promise<string> => {
  const encodedDocId = encodeURIComponent(String(docId));
  const response = await fetch(
    `${API_BASE_URL}/api/v1/documents/${encodedDocId}`
  );

  if (!response.ok) throw new Error("Failed to fetch document content");
  const data = (await response.json()) as DocumentContentResponse;
  return data.content;
};

// --------------------------------------------------------------------------
// 3. 문서 업로드 (기존 유지 - 관리자용 파싱 포함)
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
        } catch (e) {
          reject(new Error("Invalid JSON response"));
          console.error(e);
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
// 4. 문서 다운로드 (기존 유지)
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

// ==========================================================================
// 일반 사용자용 임시 업로드 (RequestModal용)
// 기존 코드에 영향 없음
// ==========================================================================
export const uploadTempDocument = async (
  file: File,
  userId: number,
  projectId: number
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_id", String(userId));
  formData.append("dept_id", "1"); // [TODO] 필요시 실제 부서 ID로 변경
  formData.append("project_id", String(projectId));
  formData.append("category", "일반");
  formData.append("version", "1.0");

  const response = await fetch(`${API_BASE_URL}/async/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`임시 업로드 실패: ${errorText}`);
  }

  // API가 업로드된 문서의 ID(식별자)를 반환
  return response.json();
};
