// src/utils/markdownParser.ts

export interface ParsedTable {
  headers: string[];
  rows: string[][];
  rawMarkdown: string;
}

export interface ParsedContent {
  cleanText: string;
  tables: ParsedTable[];
}

/**
 * 마크다운 텍스트에서 표를 추출하고, 본문에서 표를 제거한 결과를 반환합니다.
 * 표준 마크다운 표뿐만 아니라, 약식 표(구분선이 --- 만 있는 경우 등)도 지원합니다.
 */
export const parseContentWithTables = (content: string): ParsedContent => {
  const tables: ParsedTable[] = [];

  // 1. 라인 단위로 분리
  const lines = content.split("\n");

  // 추출된 표의 범위(시작줄, 끝줄)를 저장할 배열
  const extractedRanges: { start: number; end: number; lines: string[] }[] = [];

  let tableStartIndex = -1;
  // 표 파싱 중인지 여부
  let inTableBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // [판별 로직 1] 구분선인지 확인
    // 예: |---|---| 또는 ------- 또는 | :--- |
    // 조건: 하이픈(-)이 3개 이상 포함되고, 문자가 하이픈, 파이프(|), 공백, 콜론(:)으로만 구성됨
    const isSeparator =
      line.length >= 3 && /^[\s|:-]+$/.test(line) && line.includes("---");

    // [판별 로직 2] 데이터 행인지 확인 (파이프가 최소 1개 이상 포함)
    // 코드 블록(`)이나 기타 특수문자로 시작하는 경우는 제외하되,
    // LLM이 백틱 안에 표를 넣는 경우가 많으므로 백틱은 허용하고 나중에 제거
    const hasPipe = line.includes("|");

    // 표가 시작될 수 있는 조건:
    // 현재 줄이 구분선이고, 바로 윗줄이 데이터 행(헤더)일 때
    if (isSeparator && !inTableBlock) {
      if (i > 0) {
        const prevLine = lines[i - 1].trim();
        if (prevLine.includes("|")) {
          inTableBlock = true;
          tableStartIndex = i - 1; // 윗줄(헤더)부터 표 시작
        }
      }
    }

    if (inTableBlock) {
      // 표가 끝나는 조건:
      // 1. 빈 줄
      // 2. 파이프가 없는 줄 (단, 구분선인 경우는 제외)
      // 3. 백틱(`)만 있는 줄 (코드 블록 닫기)
      const isEndLine =
        line === "" ||
        (!hasPipe && !isSeparator) ||
        line === "`" ||
        line === "```";

      // 문서의 끝이거나 표가 끝나는 조건일 때
      if (isEndLine || i === lines.length - 1) {
        // 마지막 줄도 표의 일부라면 포함 (예: 문서 끝)
        const endIndex = isEndLine ? i - 1 : i;

        // 유효한 범위인지 확인 (헤더 + 구분선 + 데이터 최소 1줄 이상 권장)
        if (endIndex > tableStartIndex) {
          extractedRanges.push({
            start: tableStartIndex,
            end: endIndex,
            lines: lines.slice(tableStartIndex, endIndex + 1),
          });
        }

        inTableBlock = false;
        tableStartIndex = -1;
      }
    }
  }

  // 2. 추출된 범위를 기반으로 데이터 구조화 및 본문 제거
  // (인덱스 밀림 방지를 위해 뒤에서부터 처리)
  for (let i = extractedRanges.length - 1; i >= 0; i--) {
    const range = extractedRanges[i];
    const rawTableString = range.lines.join("\n");

    // 구분선(---)이 있는 줄의 인덱스 찾기 (헤더와 본문 분리 기준)
    const separatorIdx = range.lines.findIndex(
      (l) => /^[\s|:-]+$/.test(l.trim()) && l.includes("---")
    );

    if (separatorIdx === -1) continue; // 구분선 없으면 스킵

    // 헤더 파싱 (구분선 윗줄)
    const headerLine = range.lines[separatorIdx - 1];
    const headers = headerLine
      .split("|")
      .map((h) => h.trim().replace(/`/g, "")) // 백틱 제거
      .filter((h) => h !== "");

    // 바디 파싱 (구분선 아랫줄들)
    const bodyLines = range.lines.slice(separatorIdx + 1);
    const rows = bodyLines
      .filter((l) => l.trim().includes("|")) // 파이프 있는 줄만
      .map((rowLine) => {
        return (
          rowLine
            .split("|")
            .map((cell) => cell.trim().replace(/`/g, "")) // 백틱 제거
            // 빈 셀 필터링 로직: 헤더 개수에 맞춰서 자르거나,
            // 양옆의 의미 없는 빈 문자열만 제거
            .filter((c, idx, arr) => {
              // 양 끝의 빈 파이프 처리: (| data |) -> ["", "data", ""]
              // 데이터가 있는 셀은 유지
              return c !== "" || (idx !== 0 && idx !== arr.length - 1);
            })
        );
      });

    // 행 데이터 정규화 (헤더 개수 맞추기)
    const normalizedRows = rows.map((r) => r.slice(0, headers.length));

    if (headers.length > 0 && normalizedRows.length > 0) {
      tables.unshift({
        headers,
        rows: normalizedRows,
        rawMarkdown: rawTableString,
      });

      // 본문에서 해당 라인 제거
      lines.splice(range.start, range.end - range.start + 1);
    }
  }

  // 3. 남은 텍스트 정리
  // 백틱(`)만 남은 줄이나 불필요한 공백 제거
  const cleanText = lines
    .filter((l) => l.trim() !== "```" && l.trim() !== "`")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return { cleanText, tables };
};
