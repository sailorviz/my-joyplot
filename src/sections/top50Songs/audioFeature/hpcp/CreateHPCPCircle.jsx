import React, { useMemo, useRef, useState, useEffect } from "react";
import * as d3 from "d3";

export default function CreateHPCPCircle({
  songs,
  colorScaleMean,
  colorScaleVar,
  hover,
  setHover
}) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 600, height: 600 });
  const [layoutReady, setLayoutReady] = useState(false);

  // =========================
  // resize
  // =========================
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });

      // ⭐ 关键：标记 layout 已稳定
      setLayoutReady(true);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const SONG_COUNT = songs.length;
  const PITCH_COUNT = 12;

  const width = size.width;
  const height = size.height;

  if (!width || !height) return null;

  const cx = width / 2;
  const cy = height / 2;

  const minDim = Math.min(width, height);

  const innerEmptyRadius = minDim * 0.12;
  const outerRadius = minDim * 0.5;

  const radiusStep = (outerRadius - innerEmptyRadius) / PITCH_COUNT;
  const angleStep = (2 * Math.PI) / SONG_COUNT;

  const GAP_RATIO = 0.92;
  const RADIUS_GAP = 1.5;

  // =========================
  // HIT OVERLAYS 参数
  // =========================
  const SONG_HIT_ANGLE_RATIO = 0.5;   // Song 扇形角度覆盖比例（可调）

  // =========================
  // HOVER STATE
  // =========================
  // const [hover, setHover] = useState(null);

  // =========================
  // VISUAL CELLS（保持不变）
  // =========================
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
          color: colorScaleMean(p.mean),
          songIndex: i,
          pitchIndex: j
        });
      });
    });

    return result;
  }, [songs, colorScaleMean, angleStep, radiusStep, innerEmptyRadius]);

  // =========================
  // VARIANCE CELLS（hover song 时出现）
  // =========================
  const varianceCells = useMemo(() => {
    if (!hover || hover.type !== "song") return [];

    const songIndex = hover.songIndex;
    const song = songs[songIndex];
    if (!song) return [];

    const arc = d3.arc();
    const result = [];

    // 👉 当前 song 原始角度
    const baseAngle = songIndex * angleStep;
    const baseEnd = baseAngle + angleStep * GAP_RATIO;

    const startAngle = baseEnd;
    const endAngle = baseEnd + angleStep * GAP_RATIO;

    song.pitch.forEach((p, j) => {
      const r0 = innerEmptyRadius + j * radiusStep + RADIUS_GAP / 2;
      const r1 = r0 + radiusStep - RADIUS_GAP;

      result.push({
        path: arc({
          innerRadius: r0,
          outerRadius: r1,
          startAngle: startAngle,
          endAngle: endAngle
        }),
        color: colorScaleVar(p.variance),
        pitchIndex: j
      });
    });

    return result;

  }, [
    hover,
    songs,
    angleStep,
    innerEmptyRadius,
    radiusStep,
    colorScaleVar
  ]);

  // =========================
  // SONG OUTLINE（hover 时整体外边框）
  // =========================
  const songOutline = useMemo(() => {
    if (!hover || hover.type !== "song") return null;

    const songIndex = hover.songIndex;

    const arc = d3.arc();

    const baseAngle = songIndex * angleStep;
    const baseEnd = baseAngle + angleStep * GAP_RATIO;

    // ✅ 覆盖 variance + mean（新方向）
    const startAngle = baseAngle;
    const endAngle = baseEnd + angleStep * GAP_RATIO;

    return arc({
      innerRadius: innerEmptyRadius,
      outerRadius: outerRadius,
      startAngle,
      endAngle
    });

  }, [hover, angleStep, innerEmptyRadius, outerRadius]);

  // =========================
  // PITCH HIT OVERLAYS（改为透明环形面积 —— 推荐修复）
  // =========================
  const pitchHitOverlays = useMemo(() => {
    if (!songs || !songs.length || !layoutReady) return [];

    const arc = d3.arc();
    const result = [];

    for (let j = 0; j < PITCH_COUNT; j++) {
      const r0 = innerEmptyRadius + j * radiusStep;           // 该 pitch 的内边缘
      const r1 = innerEmptyRadius + (j + 1) * radiusStep;     // 该 pitch 的外边缘

      const path = arc({
        innerRadius: r0,
        outerRadius: r1,
        startAngle: 0,
        endAngle: 2 * Math.PI
      });

      result.push({
        path,
        pitchIndex: j,
      });
    }
    return result;
  }, [songs, innerEmptyRadius, radiusStep, layoutReady]);

  // =========================
  // SONG HIT OVERLAYS（扇形面积 —— 保持你上次的优化）
  // =========================
  const songHitOverlays = useMemo(() => {
    if (!songs || !songs.length) return [];

    const arc = d3.arc();
    const result = [];

    songs.forEach((_, i) => {
      const midAngle = i * angleStep + angleStep / 2;
      const halfHitAngle = (angleStep * SONG_HIT_ANGLE_RATIO) / 2;

      const startAngle = midAngle - halfHitAngle;
      const endAngle = midAngle + halfHitAngle;

      const path = arc({
        innerRadius: innerEmptyRadius,
        outerRadius: outerRadius,
        startAngle: startAngle,
        endAngle: endAngle
      });

      result.push({
        path,
        songIndex: i,
      });
    });

    return result;
  }, [songs, angleStep, innerEmptyRadius, outerRadius, SONG_HIT_ANGLE_RATIO]);

  // =========================
  // RENDER
  // =========================
  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        onMouseLeave={() => setHover(null)}
      >
        <g transform={`translate(${cx}, ${cy}) rotate(-90)`}>

          {/* mean Cells */}
          {cells.map((c, i) => {
            const songActive = hover?.type === "song" && hover.songIndex === c.songIndex;
            const songDim   = hover?.type === "song" && hover.songIndex !== c.songIndex;
            const pitchActive = hover?.type === "pitch" && hover.pitchIndex === c.pitchIndex;
            const pitchDim   = hover?.type === "pitch" && hover.pitchIndex !== c.pitchIndex;

            const isSongHover = hover?.type === "song";
            const isPitchHover = hover?.type === "pitch";

            const isDim = songDim || pitchDim;

            const isActive = songActive || pitchActive;

            const song = songs[c.songIndex];

            const isDominantHighlight =
              hover?.type === "pitch" &&
              c.pitchIndex === hover.pitchIndex &&
              song?.dominantPitch === hover.pitchIndex;
            const isDominantSong =
              isPitchHover && song?.dominantPitch === hover.pitchIndex;
            const isSameSongNonTargetPitch =
              isDominantSong && c.pitchIndex !== hover.pitchIndex;

            return (

              <path
                key={i}
                d={c.path}
                fill={c.color}
                stroke={
                  isDominantHighlight
                    ? "red"
                    : isActive
                      ? "white"
                      : "rgba(255,255,255,0.05)"
                }
                strokeWidth={
                  isDominantHighlight
                    ? 3
                    : isActive
                      ? 1.5
                      : 0.5
                }
                opacity={
                  isSameSongNonTargetPitch
                    ? 0.6     // ⭐ override dim（关键）
                    : isDim
                      ? 0.12
                      : 1
                }
                style={{
                  transition: "all 120ms",
                }}
              />
            );
          })}

          {/* VARIANCE CELLS */}
          {varianceCells.map((c, i) => (
            <path
              key={`var-${i}`}
              d={c.path}
              fill={c.color}
              stroke="white"
              strokeWidth={1.5}
              opacity={0.95}   // ✅ 略透明，区分层级
            />
          ))}

          {songOutline && (
            <path
              d={songOutline}
              fill="none"
              stroke="white"
              strokeWidth={4}     // ✅ 你可以调：1.5 / 2 / 2.5
              pointerEvents="none"
            />
          )}

          {/* PITCH HIT OVERLAYS（环形面积）—— 先渲染 */}
          {pitchHitOverlays.map((hit) => (
            <path
              key={`pitch-hit-${hit.pitchIndex}`}
              d={hit.path}
              fill="transparent"
              stroke="transparent"
              pointerEvents="all"
              onMouseEnter={() => setHover({ type: "pitch", pitchIndex: hit.pitchIndex })}
              onMouseLeave={() => setHover(null)}
            />
          ))}

          {/* SONG HIT OVERLAYS（扇形面积）—— 后渲染，优先级更高 */}
          {songHitOverlays.map((hit) => (
            <path
              key={`song-hit-${hit.songIndex}`}
              d={hit.path}
              fill="transparent"
              stroke="transparent"
              pointerEvents="all"
              onMouseEnter={() => setHover({ type: "song", songIndex: hit.songIndex })}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </g>

        {/* Debug */}
        {hover && (
          <text x={10} y={20} fill="black">
            {hover.type} song:{hover.songIndex ?? "-"} pitch:{hover.pitchIndex ?? "-"}
          </text>
        )}
      </svg>

      {/* 引导文字提示 */}
      <div 
        style={{
          position: "absolute",
          top: "5vh",
          paddingLeft: "0",
          background: "rgba(0,0,0,0.8)",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "13.8px",
          pointerEvents: "none",
          zIndex: 30,
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        <span style={{ opacity: 0.9 }}>
          Fan-shaped area = one song<br />
          Circular area = one pitch class
        </span>
      </div>
    </div>
  );
}

