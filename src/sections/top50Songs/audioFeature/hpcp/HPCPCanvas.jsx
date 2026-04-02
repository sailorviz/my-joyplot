import { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function HPCPCanvas({ data, colorScale }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data) return;

    const { times, values, note_labels } = data;

    // 基础检查
    if (
      !Array.isArray(times) || times.length === 0 ||
      !Array.isArray(values) || values.length === 0 ||
      !Array.isArray(note_labels) || note_labels.length === 0
    ) {
      console.warn("HPCPCanvas: invalid data structure", data);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const block = canvas.parentElement;
    const rect = block.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // 设置画布尺寸
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const rows = note_labels.length; // 12
    const cols = times.length;       // 横轴时间

    const margin = { left: 0, right: 0, top: 0, bottom: 0 };
    const drawWidth = rect.width - margin.left - margin.right;
    const drawHeight = rect.height - margin.top - margin.bottom;

    const cellWidth = drawWidth / cols;
    const cellHeight = drawHeight / rows;

    const xScale = (i) => margin.left + i * cellWidth;
    const yScale = (i) => margin.top + drawHeight - (i + 1) * cellHeight;

    // 颜色归一化
    // const flat = values.flat();
    // const min = Math.min(...flat);
    // const max = Math.max(...flat);

    // const getColor = (v) => {
    //   const norm = (v - min) / (max - min || 1);
    //   return d3.interpolateViridis(norm);
    // };

    if (!colorScale) {
      console.warn("HPCPCanvas: missing colorScale");
      return;
    }

    // 绘制 HPCP
    for (let t = 0; t < cols; t++) {
      for (let p = 0; p < rows; p++) {
        const v = values[t][p]; // pitch 在外，time 在内
        ctx.fillStyle = colorScale(v);
        ctx.fillRect(
          xScale(t),
          yScale(p),
          Math.max(1, cellWidth + 1),
          Math.max(1, cellHeight + 1)
        );
      }
    }

  }, [data, colorScale]);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
}