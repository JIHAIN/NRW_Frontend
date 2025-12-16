import { API_BASE_URL } from "@/lib/constants";
import type {
  Document,
  DocumentDetailResponse,
  DocumentStatus,
  DocumentChunk,
} from "@/types/UserType";

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

export interface UploadMetadata {
  dept_id: number;
  project_id: number;
  user_id: number;
  category?: string;
}

// 경량 문서 응답 인터페이스
export interface DocumentTitleResponse {
  id: number;
  original_filename: string;
}

// 문서 제목 목록 조회 API (경량화)
export const fetchDocumentTitles = async (
  docIds: number[]
): Promise<DocumentTitleResponse[]> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/titles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ doc_ids: docIds }),
  });

  if (!response.ok) {
    throw new Error("문서 제목 조회 실패");
  }

  return response.json();
};

// --------------------------------------------------------------------------
// 🔄 데이터 변환 헬퍼
// --------------------------------------------------------------------------
const mapApiToDocument = (data: BackendDocument): Document => {
  return {
    id: data.id,
    userId: data.user_id,
    departmentId: data.dept_id,
    projectId: data.project_id,
    title: data.original_filename,
    content: "",
    originalFilename: data.original_filename,
    storedPath: data.stored_path,
    fileExt: data.file_ext.replace(".", ""),
    fileSize: data.file_size || 0,
    category: "GENERAL",
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
// 2. 문서 내용 조회 (전처리 로직 수정됨)
// --------------------------------------------------------------------------
export const fetchDocumentContent = async (
  docId: number
): Promise<DocumentDetailResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/${docId}`);

  if (!response.ok) throw new Error("Failed to fetch document content");

  const data = (await response.json()) as DocumentDetailResponse;

  if (data.content) {
    data.content = data.content.replace(/\uFFFD/g, "");
  }

  // [수정 포인트] HWPX 파일인지 확인 (대소문자 무시)
  // original_filename이 없으면 안전하게 false 처리
  const isHwpx = data.original_filename
    ? data.original_filename.toLowerCase().endsWith(".hwpx")
    : false;

  // 청크 처리 로직
  if (data.chunks && Array.isArray(data.chunks)) {
    // 1. HWP 파일 등(.hwpx가 아님)은 별표 로직을 태우지 않고 그대로 반환 (단, 유니코드 제어문자만 제거)
    if (!isHwpx) {
      data.chunks = data.chunks.map((item) => {
        if (item.content) {
          item.content = item.content.replace(/\uFFFD/g, "");
        }
        return item;
      });
    }
    // 2. HWPX 파일인 경우에만 "별표/표" 병합 로직 수행
    else {
      const finalChunks: DocumentChunk[] = [];
      let sectionBuffer: DocumentChunk[] = [];
      let isInsideSection = false;

      const flushSectionBuffer = () => {
        if (sectionBuffer.length === 0) return;

        const tableChunks: DocumentChunk[] = [];
        const textParagraphIds: number[] = [];

        sectionBuffer.forEach((item) => {
          const contentStr = item.content || "";
          const isHeader = /^\[?\(?별[표지]/.test(contentStr);
          const isTable = item.metadata?.type === "table";

          if (isHeader) {
            // 헤더는 버림
          } else if (isTable) {
            if (item.content) {
              item.content = item.content.replace(/^\[표[^\]]+\]\s*/, "");
            }
            tableChunks.push(item);
          } else {
            // 텍스트는 버리지만 ID는 수집
            textParagraphIds.push(item.paragraph_idx);
          }
        });

        // 수집된 ID를 표 메타데이터에 주입
        if (tableChunks.length > 0 && textParagraphIds.length > 0) {
          tableChunks.forEach((table) => {
            table.metadata = {
              ...table.metadata,
              related_paragraphs: [
                ...(table.metadata.related_paragraphs || []),
                ...textParagraphIds,
              ],
            };
          });
        }

        finalChunks.push(...tableChunks);
        sectionBuffer = [];
      };

      for (const item of data.chunks) {
        if (item.content) item.content = item.content.replace(/\uFFFD/g, "");

        const contentStr = item.content || "";
        const isSectionHeader = /^\[?\(?별[표지]/.test(contentStr);

        if (isSectionHeader) {
          if (isInsideSection) flushSectionBuffer();
          isInsideSection = true;
          sectionBuffer.push(item);
        } else if (isInsideSection) {
          sectionBuffer.push(item);
        } else {
          const isTable = item.metadata?.type === "table";
          if (isTable && item.content) {
            item.content = item.content.replace(/^\[표[^\]]+\]\s*/, "");
          }
          finalChunks.push(item);
        }
      }

      if (isInsideSection) flushSectionBuffer();
      data.chunks = finalChunks;
    }
  }

  return data;
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
// 5. 일반 사용자용 임시 업로드 (승인 대기용)
// --------------------------------------------------------------------------

interface UploadTempParams {
  file: File;
  deptId: number;
  projectId: number;
  userId: number;
  category: string;
}

export const uploadTempDocument = async ({
  file,
  deptId,
  projectId,
  userId,
  category,
}: UploadTempParams): Promise<number> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_id", String(userId));
  formData.append("dept_id", String(deptId));
  formData.append("project_id", String(projectId));
  formData.append("category", category);
  formData.append("version", "1.0");

  const response = await fetch(`${API_BASE_URL}/async/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "임시 업로드 실패");
  }

  const data = await response.json();
  return data.id;
};

/**
 * 문서 삭제 API
 */
export const deleteDocument = async (documentId: number): Promise<string> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/documents/${documentId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`문서 삭제 실패: ${response.status} - ${errorBody}`);
  }

  return response.text();
};
