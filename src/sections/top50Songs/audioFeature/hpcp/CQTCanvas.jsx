import { useRef, useEffect } from "react";
import { interpolateInferno } from "d3-scale-chromatic";

export default function CQTCanvas({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data) {
        console.log("CQTCanvas: no data");
        return;
      }

    const { times, values, note_labels } = data;

    if (
      !Array.isArray(times) || times.length === 0 ||
      !Array.isArray(values) || values.length === 0 ||
      !Array.isArray(note_labels) || note_labels.length === 0
    ) {
      console.warn("CQTCanvas: invalid data structure", data);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("CQTCanvas: canvas ref is null");
      return;
    }

    const block = canvas.parentElement;
    const rect = block.getBoundingClientRect();
    console.log("Canvas container size:", rect.width, "x", rect.height);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // ===== 下面是原来的绘制逻辑（先保持不变）=====
    const rows = note_labels.length;
    const cols = times.length;
    const margin = { left: 0, right: 0, top: 0, bottom: 0 };
    const drawWidth = rect.width - margin.left - margin.right;
    const drawHeight = rect.height - margin.top - margin.bottom;

    const cellWidth = drawWidth / cols;
    const cellHeight = drawHeight / rows;

    const xScale = (i) => margin.left + i * cellWidth;
    const yScale = (i) => margin.top + drawHeight - (i + 1) * cellHeight;

    const flat = values.flat();
    const min = Math.min(...flat);
    const max = Math.max(...flat);
    console.log("Color range:", min, "→", max);

    const getColor = (v) => {
      const norm = (v - min) / (max - min || 1);
      return interpolateInferno(norm);
    };

    // 绘制 spectrogram
    for (let f = 0; f < cols; f++) {
      for (let b = 0; b < rows; b++) {
        ctx.fillStyle = getColor(values[f][b]);
        ctx.fillRect(
          xScale(f),
          yScale(b),
          Math.max(1, cellWidth + 1),
          Math.max(1, cellHeight + 1)
        );
      }
    }

  }, [data]);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
}