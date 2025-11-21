import { API_BASE_URL } from "@/lib/constants";
import type { Document } from "@/types/UserType";

// 백엔드 API 응답 타입 정의 (DTO)
interface BackendDocument {
  user_id: string;
  doc_id: string; // 파일명 역할
  files: string[]; // 파일 목록
  path: string; // 저장 경로
  // dept_id, project_id 등은 현재 API 응답에 없으므로 제외 (있다면 추가)
}

// 업로드 메타데이터 타입
interface UploadMetadata {
  dept_id: number;
  project_id: number;
  user_id: number;
  category?: string;
}

// --------------------------------------------------------------------------
// 🔄 데이터 변환 헬퍼 (Backend JSON -> Frontend Document Type)
// --------------------------------------------------------------------------
const mapApiToDocument = (data: BackendDocument, index: number): Document => {
  const filename = data.files?.[0] || data.doc_id;
  const ext = filename.split(".").pop() || "unknown";

  return {
    id: index + 1,
    userId: Number(data.user_id) || 0,
    departmentId: 0, // API 미제공
    projectId: 0, // API 미제공

    originalFilename: data.doc_id,
    storedPath: data.path,
    fileExt: ext,
    fileSize: 0,

    category: "GENERAL",
    status: "COMPLETED",
    version: "1.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// --------------------------------------------------------------------------
// 1. 문서 목록 조회
// --------------------------------------------------------------------------
export const fetchDocuments = async (): Promise<Document[]> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents`);
  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }
  const list: BackendDocument[] = await response.json(); // ✨ 타입 명시
  return list.map((item, index) => mapApiToDocument(item, index));
};

// --------------------------------------------------------------------------
// 2. 문서 내용 조회 (API 명세 반영)
// GET /api/v1/documents/{user_id}/{doc_id} -> Returns "string"
// --------------------------------------------------------------------------

export const fetchDocumentContent = async (
  userId: string | number,
  docId: string
): Promise<string> => {
  const encodedDocId = encodeURIComponent(docId);
  const response = await fetch(
    `${API_BASE_URL}/api/v1/documents/${userId}/${encodedDocId}`
  );

  if (!response.ok) throw new Error("Failed to fetch document content");

  // Swagger 명세상 Response가 "string"이므로 텍스트로 반환
  return response.json();
};

// --------------------------------------------------------------------------
// 3. 문서 업로드
// --------------------------------------------------------------------------
export const uploadDocument = async (
  file: File,
  metadata: UploadMetadata // ✨ 타입 명시
) => {
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

  const response = await fetch(
    `${API_BASE_URL}/api/v1/parsing/upload-and-parse/`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: "Unknown error" }));
    console.error("Upload Error Detail:", errorData);
    throw new Error(errorData.detail || `Upload failed: ${response.status}`);
  }
  return response.json();
};

// --------------------------------------------------------------------------
// 4. 문서 다운로드 (API 명세 반영)
// GET /api/v1/documents/download/{user_id}/{doc_id}
// --------------------------------------------------------------------------
export const downloadDocument = async (
  userId: string | number,
  docId: string,
  filename: string
): Promise<void> => {
  const encodedDocId = encodeURIComponent(docId);
  // ✨ 경로 수정: /download/ 추가됨
  const response = await fetch(
    `${API_BASE_URL}/api/v1/documents/download/${userId}/${encodedDocId}`
  );

  // 저 위에 /original.hwp 이거 나중에 지워줘야함 지금 구조가 이상해서 그럼

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
