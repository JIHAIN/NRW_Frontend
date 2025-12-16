// src/components/common/IcosahedronLogo.tsx
import { useEffect, useRef, memo } from "react";

interface IcosahedronLogoProps {
  size?: number;
  className?: string;
}

// 렌더링과 상관없는 상수 데이터는 컴포넌트 밖으로 뺍니다 (메모리 절약)
const t = (1 + Math.sqrt(5)) / 2;
const VERTICES = [
  { x: -1, y: t, z: 0 },
  { x: 1, y: t, z: 0 },
  { x: -1, y: -t, z: 0 },
  { x: 1, y: -t, z: 0 },
  { x: 0, y: -1, z: t },
  { x: 0, y: 1, z: t },
  { x: 0, y: -1, z: -t },
  { x: 0, y: 1, z: -t },
  { x: t, y: 0, z: -1 },
  { x: t, y: 0, z: 1 },
  { x: -t, y: 0, z: -1 },
  { x: -t, y: 0, z: 1 },
];
const EDGES = [
  [0, 11],
  [0, 5],
  [0, 1],
  [0, 7],
  [0, 10],
  [1, 5],
  [1, 9],
  [1, 8],
  [1, 7],
  [2, 11],
  [2, 10],
  [2, 6],
  [2, 3],
  [2, 4],
  [3, 4],
  [3, 9],
  [3, 8],
  [3, 6],
  [4, 11],
  [4, 5],
  [4, 9],
  [5, 11],
  [5, 9],
  [6, 10],
  [6, 8],
  [6, 7],
  [7, 10],
  [7, 8],
  [8, 9],
  [10, 11],
];

const IcosahedronLogo = ({ size = 24, className }: IcosahedronLogoProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let angleX = 0;
    let angleY = 0;

    const render = () => {
      // 1. 캔버스 지우기
      ctx.clearRect(0, 0, size, size); // size 변수 사용

      const cx = size / 2;
      const cy = size / 2;
      const scale = size / 4;

      // 2. 스타일
      ctx.strokeStyle = "#fffff";
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";

      // 3. 회전
      angleX += 0.01;
      angleY += 0.015;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // 4. 투영 및 그리기
      const projected = VERTICES.map((v) => {
        const ry = v.y * cosX - v.z * sinX;
        const rz = v.y * sinX + v.z * cosX;
        const rx = v.x * cosY - rz * sinY;
        const rz2 = v.x * sinY + rz * cosY;

        const perspective = 4;
        const dist = perspective + rz2 / 4;
        const val = scale * (perspective / dist);

        return { x: cx + rx * val, y: cy + ry * val };
      });

      ctx.beginPath();
      for (let i = 0; i < EDGES.length; i++) {
        const [s, e] = EDGES[i]; // 타입 단언 없이 사용 가능하도록 수정함
        const p1 = projected[s];
        const p2 = projected[e];
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [size]); // size가 바뀔 때만 재시작

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      // 인라인 스타일 제거 (hidden 문제 해결의 핵심)
    />
  );
};

// [핵심] React.memo로 감싸서 부모가 렌더링돼도 나는 다시 그려지지 않게 함
export default memo(IcosahedronLogo);
