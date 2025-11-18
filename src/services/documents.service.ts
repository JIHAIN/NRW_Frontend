import { API_BASE_URL } from "@/lib/constants";
import type { Document } from "@/types/UserType";

// --------------------------------------------------------------------------
// 🔄 데이터 변환 헬퍼 (Backend JSON -> Frontend Document Type)
// --------------------------------------------------------------------------
const mapApiToDocument = (data: any, index: number): Document => {
  // 파일 확장자 추출 (files 배열의 첫 번째 요소 사용)
  const filename = data.files?.[0] || data.doc_id;
  const ext = filename.split(".").pop() || "unknown";

  return {
    // 1. ID 처리: API에 숫자 ID가 없으므로 리스트 인덱스를 임시 ID로 사용
    id: index + 1,

    // 2. 관계 ID 매핑
    userId: Number(data.user_id) || 0, // 문자열 "2" -> 숫자 2
    departmentId: 0, // (API 미제공) 임시값 0
    projectId: 0, // (API 미제공) 임시값 0

    // 3. 파일 정보 매핑
    originalFilename: data.doc_id, // "2팀...hwp"
    storedPath: data.path, // "app/data/..."
    fileExt: ext,
    fileSize: 0, // (API 미제공)

    // 4. 메타데이터 (기본값 설정)
    category: "GENERAL",
    status: "COMPLETED", // 목록에 있으면 처리 완료된 것으로 간주
    version: "1.0",

    // 5. 날짜 (API 미제공 -> 현재 시간)
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// --------------------------------------------------------------------------
// 1. 문서 목록 조회 (GET /api/v1/documents/)
// --------------------------------------------------------------------------
export const fetchDocuments = async (): Promise<Document[]> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/documents/`);

  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }

  const list = await response.json();

  // API 응답 배열을 map으로 돌면서 변환
  return list.map((item: any, index: number) => mapApiToDocument(item, index));
};

// --------------------------------------------------------------------------
// 2. 특정 문서 내용 조회 (GET /api/v1/documents/{user_id}/{doc_id})
// --------------------------------------------------------------------------
export const fetchDocumentContent = async (userId: string, docId: string) => {
  // user_id 파라미터 처리 ("user=1" 형태인지 확인)
  // const formattedUserId = userId.startsWith("user=") ? userId : `user=${userId}`;
  // -> (수정) 로그를 보니 path에는 "user=1"이 들어가야 하지만, API 호출시엔 값만 넣어야 할 수도 있습니다.
  //    일단 API 명세대로 userId 값 그대로 넣고, 만약 404나면 "user=" 붙이는 로직 추가하세요.

  // doc_id(파일명) 인코딩
  const encodedDocId = encodeURIComponent(docId);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/documents/${userId}/${encodedDocId}`
  );

  if (!response.ok) throw new Error("Failed to fetch document content");
  return response.json();
};

// 3. 업로드 함수 (기존 유지)
export const uploadDocument = async (
  file: File,
  metadata: {
    dept_id: number; // string -> number (API 명세: integer)
    project_id: number; // string -> number
    user_id: number; // string -> number
    category?: string;
  }
) => {
  const formData = new FormData();
  formData.append("file", file);

  // ✨ 숫자형 데이터를 문자열로 변환하여 FormData에 추가
  // (0이면 보내지 않거나, 백엔드가 0을 허용하지 않는다면 유효성 검사 필요)
  formData.append("user_id", String(metadata.user_id));
  formData.append("dept_id", String(metadata.dept_id));
  formData.append("project_id", String(metadata.project_id));

  if (metadata.category) {
    formData.append("category", metadata.category);
  }

  // ✨ [추가] 필수 필드: 버전 및 업로드 날짜
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
    // 422 에러 등 디테일한 에러 메시지 확인을 위해 로그 출력
    console.error("Upload Error Detail:", errorData);
    throw new Error(errorData.detail || `Upload failed: ${response.status}`);
  }
  return response.json();
};

// 4. 다운로드 함수 (임시 - JSON 다운로드됨)
export const downloadDocument = async (
  userId: string,
  docId: string,
  filename: string
) => {
  const encodedDocId = encodeURIComponent(docId);
  const response = await fetch(
    `${API_BASE_URL}/api/v1/documents/${userId}/${encodedDocId}`
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
