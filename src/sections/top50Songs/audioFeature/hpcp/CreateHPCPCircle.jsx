import React, { useMemo, useRef, useState, useEffect } from "react";
import * as d3 from "d3";

export default function CreateHPCPCircle({
  songs,
  colorScaleMean,
}) {
  // ===== ⭐ MOD 1: 容器 + 动态尺寸 =====
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 600, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // ===== 2. 数据规模 =====
  const SONG_COUNT = songs.length;
  const PITCH_COUNT = 12;

  // ===== ⭐ MOD 2: 动态尺寸替代固定 600 =====
  const width = size.width;
  const height = size.height;

  const cx = width / 2;
  const cy = height / 2;

  // ===== ⭐ MOD 3: 响应式 radius（核心视觉）=====
  const minDim = Math.min(width, height);

  const innerEmptyRadius = minDim * 0.12;  // 原来 70
  const outerRadius = minDim * 0.5;       // 原来 280

  const radiusStep = (outerRadius - innerEmptyRadius) / PITCH_COUNT;
  const angleStep = (2 * Math.PI) / SONG_COUNT;

  const GAP_RATIO = 0.92;
  const RADIUS_GAP = 1.5;

  // ===== 4. 生成 cells =====
  const cells = useMemo(() => {
    if (!songs || !songs.length) return [];

    const arc = d3.arc();
    const result = [];

    songs.forEach((song, i) => {
      song.pitch.forEach((p, j) => {

        const a0 = i * angleStep;
        const a1 = a0 + angleStep * GAP_RATIO;

        const r0 = innerEmptyRadius + j * radiusStep + RADIUS_GAP / 2;
        const r1 = r0 + radiusStep - RADIUS_GAP;

        result.push({
          path: arc({
            innerRadius: r0,
            outerRadius: r1,
            startAngle: a0,
            endAngle: a1
          }),
          color: colorScaleMean(p.mean)
        });

      });
    });

    return result;

  }, [songs, colorScaleMean, angleStep, radiusStep, innerEmptyRadius]);

  // ===== ⭐ MOD 4: 防止 size 未初始化 =====
  if (!width || !height) return null;

  // ===== 5. 渲染 =====
  return (
    // ⭐ MOD 5: 外层容器必须撑满
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
      >
        <g transform={`translate(${cx}, ${cy}) rotate(-90)`}>
          {cells.map((c, i) => (
            <path
              key={i}
              d={c.path}
              fill={c.color}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={0.5}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}