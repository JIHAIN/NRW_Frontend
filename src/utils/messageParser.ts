// src/utils/messageParser.ts

export interface ParsedMessageMetadata {
  sources: string[];
  contextUsed: string;
}

/**
 * 메시지 본문(content)을 분석하여 소스(출처)와 근거(context)를 추출합니다.
 * 백엔드에서 메타데이터를 따로 저장하지 않는 과거 내역 호환용입니다.
 */
export const extractMetadataFromContent = (
  content: string
): ParsedMessageMetadata => {
  const result: ParsedMessageMetadata = {
    sources: [],
    contextUsed: "",
  };

  if (!content) return result;

  // 1. 출처 추출 로직
  // 예: "3. 출처: 주차장관리지침(2023년도 4월 개정)" 또는 "출처: 파일A, 파일B"
  // 정규식: "출처:" 또는 "근거:" 뒤에 오는 텍스트를 잡음
  const sourceMatch = content.match(/(?:출처|근거|Source):\s*(.+)$/m);

  if (sourceMatch && sourceMatch[1]) {
    // 콤마(,)로 구분된 경우 처리 및 불필요한 공백/마침표 제거
    const rawSources = sourceMatch[1].split(/,|;/);
    result.sources = rawSources
      .map((s) => s.trim().replace(/\.$/, "")) // 끝에 마침표 제거
      .filter((s) => s.length > 0);
  }

  // 2. 근거(Context) 추출 로직
  // LLM 응답 패턴이 "2. [근거내용]" 또는 "2. 근거: ..." 형태라고 가정
  // "2." 으로 시작하고 다음 "3." 이 나오기 전까지의 내용을 잡음
  const contextMatch = content.match(/2\.\s*(.*?)(?=\n3\.|3\.\s|$)/s);

  if (contextMatch && contextMatch[1]) {
    let extracted = contextMatch[1].trim();

    // 만약 "근거:" 라는 단어로 시작하면 제거
    extracted = extracted.replace(/^(근거|내용):\s*/, "");

    // 따옴표("")로 감싸져 있다면 제거 (검색 정확도를 위해)
    extracted = extracted.replace(/^["']|["']$/g, "");

    // 마크다운 표가 포함되어 있다면 표는 제외하고 텍스트만 추출 (선택사항)
    // 여기서는 단순화하여 전체를 사용하되, 검색 시 정규화 로직(DocViewer)이 처리하도록 함
    result.contextUsed = extracted;
  } else {
    // 2번 항목을 못 찾았다면, 전체 텍스트를 context로 사용하되
    // 너무 길 수 있으므로 1번(답변) 항목을 제외한 부분을 시도하거나
    // 답변 전체를 fallback으로 설정
    result.contextUsed = content;
  }

  return result;
};
