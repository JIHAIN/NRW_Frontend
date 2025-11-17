import React from "react";
import StatsChart from "./components/StatsChart";

/**
 * DashBoard
 * - 대시보드 상단 요약 카드
 * - 검색 기능 사용 수(요청/답변/실패) 요약
 * - 문서 업로드 상태 도넛 차트 + 상세 수치
 * - 예시 차트(간단 SVG) 영역
 *
 * 실제 데이터 연동 시:
 * - 아래 mock 데이터 타입을 유지하고 fetch 결과를 주입하세요.
 * - 실시간 새로고침이 필요하면 SWR/React Query 등을 적용하세요.
 */
export default function DashboardPage() {
  /* ===========================
   * 1) 타입 정의
   * ===========================
   */
  // 상단 요약 카드 수치의 공통 타입
  type SummaryMetric = {
    label: string; // 카드 제목(예: "검색 사용자 수")
    value: number | string; // 표시값
    icon?: React.ReactNode; // 아이콘(옵션)
    tone?: string; // 배경 톤 클래스(Tailwind, 옵션)
  };

  // 검색 기능 사용 수 세부 지표
  type SearchUsageBreakdown = {
    request: number; // 요청 수
    answer: number; // 답변 수
    fail: number; // 실패 수
  };

  // 문서 업로드 상태 지표
  type UploadStatus = {
    done: number; // 완료 개수
    processing: number; // 진행 중 개수
    queued: number; // 대기 개수
    error: number; // 오류 개수
  };

  // 예시 라인차트용 시간대별 응답(ms)
  type ResponseTimePoint = {
    hour: number;
    total: number;
    qa: number;
    keyword: number;
  };

  // 예시 바차트용 날짜별 오류 수
  type ErrorByDate = { date: string; count: number };

  /* ===========================
   * 2) 목업 데이터
   *    실제 연결 시 API 결과로 대체
   * ===========================
   */
  const now = new Date();
  const headerDate = `${now.getFullYear()}. ${String(
    now.getMonth() + 1
  ).padStart(2, "0")}. ${String(now.getDate()).padStart(2, "0")} ${String(
    now.getHours()
  ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
    now.getSeconds()
  ).padStart(2, "0")} 기준`;

  const topMetrics: SummaryMetric[] = [
    { label: "검색 사용자 수", value: 10, tone: "bg-rose-50" },
    { label: "검색 기능 사용 수", value: 234, tone: "bg-green-50" },
    { label: "등록 완료 문서 수", value: 9, tone: "bg-violet-50" },
  ];

  const searchUsage: SearchUsageBreakdown = {
    request: 234,
    answer: 215,
    fail: 19,
  };

  const uploadStatus: UploadStatus = {
    done: 3265,
    processing: 0,
    queued: 0,
    error: 100,
  };

  // 간단 라인차트용 예시 데이터(0~23시)
  const responseSeries: ResponseTimePoint[] = Array.from(
    { length: 24 },
    (_, h) => ({
      hour: h,
      total: h === 7 ? 3500 : 150, // 7시에 스파이크 예시
      qa: h === 7 ? 3200 : 120,
      keyword: h === 7 ? 2800 : 80,
    })
  );

  const errorByDate: ErrorByDate[] = [
    { date: "2024-10-15", count: 20 },
    { date: "2024-10-16", count: 28 },
    { date: "2024-10-17", count: 65 },
    { date: "2024-10-18", count: 18 },
    { date: "2024-10-19", count: 12 },
    { date: "2024-10-20", count: 40 },
    { date: "2024-10-21", count: 55 },
    { date: "2024-10-22", count: 22 },
  ];

  /* ===========================
   * 3) 계산 유틸
   * ===========================
   */
  // 문서 업로드 상태 전체 대비 완료율 계산
  const totalUploads =
    uploadStatus.done +
    uploadStatus.processing +
    uploadStatus.queued +
    uploadStatus.error;
  const completionRate =
    totalUploads === 0
      ? 0
      : Math.round((uploadStatus.done / totalUploads) * 100);

  // 도넛 차트(원형 진행) 각도 계산을 위한 유틸
  const circle = { r: 56, cx: 64, cy: 64 }; // 반지름, 중심
  const circumference = 2 * Math.PI * circle.r;
  const strokeDashoffset = circumference * (1 - completionRate / 100);

  // 라인차트 그리기 위한 path 생성
  const lineChartWidth = 560;
  const lineChartHeight = 160;
  const maxY = Math.max(...responseSeries.map((p) => p.total), 3600);
  const X = (i: number) => (i / 23) * (lineChartWidth - 40) + 20; // 좌우 여백 20
  const Y = (v: number) =>
    lineChartHeight - 20 - (v / maxY) * (lineChartHeight - 40); // 상하 여백 20

  const toPath = (key: keyof ResponseTimePoint) =>
    responseSeries
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"} ${X(i).toFixed(1)} ${Y(p[key]).toFixed(1)}`
      )
      .join(" ");

  // StatsChart 컴포넌트에 전달할 데이터로 변환
  const barChartData = errorByDate.map((d) => ({
    name: d.date.slice(5), // "10-15" 형식으로 변환
    count: d.count,
  }));

  /* ===========================
   * 4) 렌더
   * ===========================
   */
  return (
    <section className="page-layout">
      {/* 헤더 */}
      <header className="mb-6">
        <h1 className="page-title">대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">{headerDate}</p>
      </header>

      {/* 날짜 필터 예시 */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm text-gray-600">기간</label>
        <select
          className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
          defaultValue="오늘"
          aria-label="기간 선택"
        >
          <option>오늘</option>
          <option>어제</option>
          <option>최근 7일</option>
          <option>최근 30일</option>
        </select>
      </div>

      {/* ===========================
          상단 요약 카드
          - 사용자/기능사용/등록문서 등 핵심 KPI를 한눈에 표시
         =========================== */}
      <section className="grid gap-4 md:grid-cols-3">
        {topMetrics.map((m) => (
          <article
            key={m.label}
            className={`rounded-xl border border-gray-100 ${
              m.tone ?? "bg-gray-50"
            } p-5`}
          >
            {/* 카드 제목 */}
            <div className="text-sm text-gray-600">{m.label}</div>

            {/* 중요 수치
                - 숫자는 시선을 끌기 위해 굵고 크게
                - 실제 환경에서는 애니메이션 카운트업 적용 가능 */}
            <div className="mt-4 text-3xl font-bold text-gray-900">
              {m.value}
            </div>
          </article>
        ))}
      </section>

      {/* ===========================
          중단 2열: 좌) 검색 기능 사용 수, 우) 문서 업로드 상태
         =========================== */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* 검색 기능 사용 수 요약 */}
        <article className="rounded-xl border border-gray-100 bg-white p-5">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">검색 기능 사용 수</h2>
            {/* 간단 기간 선택 */}
            <select className="h-8 rounded-md border border-gray-200 bg-white px-2 text-sm">
              <option>오늘</option>
              <option>어제</option>
              <option>최근 7일</option>
            </select>
          </header>

          {/* 세부 지표 3분류
              - 요청/답변/실패를 나란히 배치
              - 색상으로 직관적 구분 */}
          <div className="grid grid-cols-3 gap-4">
            {/* 요청 */}
            <div className="rounded-lg bg-green-50 p-4">
              <div className="text-sm text-gray-600">요청</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {searchUsage.request}
              </div>
            </div>

            {/* 답변 */}
            <div className="rounded-lg bg-indigo-50 p-4">
              <div className="text-sm text-gray-600">답변</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {searchUsage.answer}
              </div>
            </div>

            {/* 실패 */}
            <div className="rounded-lg bg-rose-50 p-4">
              <div className="text-sm text-gray-600">실패</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {searchUsage.fail}
              </div>
            </div>
          </div>

          {/* 설명 주석:
              - 위 3박스는 "속성 카드"에 해당.
              - 서버에서 받은 집계 수치를 그대로 노출하되,
                실패 비율이 임계치(예: 5% 이상)일 경우 경고 배지 추가 가능. */}
        </article>

        {/* 문서 업로드 상태 */}
        <article className="rounded-xl border border-gray-100 bg-white p-5">
          <header className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-semibold">문서 업로드 상태</h2>
            <span className="text-gray-400" title="업로드 파이프라인 상태 요약">
              ⓘ
            </span>
          </header>

          <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2">
            {/* 도넛 차트
                - SVG 원 2개를 겹쳐 진행률을 표현
                - 접근성: 중앙에 % 텍스트 표기 */}
            <div className="flex items-center justify-center">
              <svg
                width="128"
                height="128"
                viewBox="0 0 128 128"
                role="img"
                aria-label="업로드 완료율"
              >
                {/* 배경 원(트랙) */}
                <circle
                  cx={circle.cx}
                  cy={circle.cy}
                  r={circle.r}
                  fill="none"
                  stroke="#E5E7EB" // gray-200
                  strokeWidth="14"
                />
                {/* 진행 원(Stroke Dash로 절반 이상 표현) */}
                <circle
                  cx={circle.cx}
                  cy={circle.cy}
                  r={circle.r}
                  fill="none"
                  stroke="url(#g1)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 64 64)" // 12시 방향 시작
                />
                {/* 그라디언트 정의 */}
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" />
                    {/* violet-400 */}
                    <stop offset="100%" stopColor="#F472B6" />
                    {/* pink-400 */}
                  </linearGradient>
                </defs>

                {/* 중앙 텍스트 */}
                <text
                  x="50%"
                  y="50%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  className="fill-gray-900 text-2xl font-bold"
                >
                  {completionRate}%
                </text>
              </svg>
            </div>

            {/* 상세 수치 나열
                - 각 상태를 색상으로 구분
                - 실제 서비스에서는 상태 추가/변경에 대비해 맵 기반 렌더 권장 */}
            <ul className="space-y-3">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-700">
                  <i className="h-3 w-3 rounded bg-indigo-500" aria-hidden />
                  완료
                </span>
                <span className="text-sm font-semibold tabular-nums text-gray-900">
                  {uploadStatus.done.toLocaleString()}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-700">
                  <i className="h-3 w-3 rounded bg-emerald-500" aria-hidden />
                  진행 중
                </span>
                <span className="text-sm font-semibold tabular-nums text-gray-900">
                  {uploadStatus.processing.toLocaleString()}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-700">
                  <i className="h-3 w-3 rounded bg-amber-400" aria-hidden />
                  대기
                </span>
                <span className="text-sm font-semibold tabular-nums text-gray-900">
                  {uploadStatus.queued.toLocaleString()}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-700">
                  <i className="h-3 w-3 rounded bg-rose-500" aria-hidden />
                  오류
                </span>
                <span className="text-sm font-semibold tabular-nums text-gray-900">
                  {uploadStatus.error.toLocaleString()}
                </span>
              </li>
            </ul>
          </div>

          {/* 설명 주석:
              - 완료율 = 완료 / 전체 * 100
              - "오류"는 재시도 대상이므로 별도 테이블로 드릴다운 링크 제공 가능
              - 상태 값은 백엔드에서 배치/이벤트로 집계해 제공하는 것을 권장 */}
        </article>
      </section>

      {/* ===========================
          하단 차트 영역(간단 SVG 예시)
         =========================== */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* 시간대별 응답 시간 */}
        <article className="rounded-xl border border-gray-100 bg-white p-5">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">시간대별 응답 시간</h2>
            <time className="text-sm text-gray-500">
              {now.getFullYear()}.{String(now.getMonth() + 1).padStart(2, "0")}.
              {String(now.getDate()).padStart(2, "0")}
            </time>
          </header>

          <svg
            width={lineChartWidth}
            height={lineChartHeight}
            role="img"
            aria-label="응답 시간 라인차트"
          >
            {/* 축 가이드 */}
            <line
              x1="20"
              y1={lineChartHeight - 20}
              x2={lineChartWidth - 20}
              y2={lineChartHeight - 20}
              stroke="#E5E7EB"
            />
            <line
              x1="20"
              y1="20"
              x2="20"
              y2={lineChartHeight - 20}
              stroke="#E5E7EB"
            />

            {/* 전체 응답 라인 */}
            <path
              d={toPath("total")}
              fill="none"
              stroke="#111827"
              strokeWidth="2"
            />
            {/* 질의 응답 라인 */}
            <path
              d={toPath("qa")}
              fill="none"
              stroke="#4F46E5"
              strokeWidth="2"
            />
            {/* 키워드 검색 라인 */}
            <path
              d={toPath("keyword")}
              fill="none"
              stroke="#A855F7"
              strokeWidth="2"
            />
          </svg>

          <p className="mt-2 text-xs text-gray-500">
            단위: ms. 실제 서비스에서는 툴팁, 축 라벨, 범례를 추가하세요.
          </p>
        </article>

        {/* 날짜별 검색 오류 수 */}
        <article className="rounded-xl border border-gray-100 bg-white p-5">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">날짜별 검색 오류 수</h2>
            <span className="text-sm text-gray-500">
              {errorByDate[0].date} ~ {errorByDate[errorByDate.length - 1].date}
            </span>
          </header>

          <StatsChart data={barChartData} />

          <p className="mt-2 text-xs text-gray-500">
            막대 클릭 시 해당 날짜의 실패 로그 목록으로 라우팅하는 UX를
            추천합니다.
          </p>
        </article>
      </section>
    </section>
  );
}
