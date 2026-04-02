import { useRef, useEffect, useState } from "react";

export default function HPCPCanvasPlus({ dataPath, onDataReady, colorScale }) {
  const canvasRef = useRef(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!dataPath) return;

    fetch(dataPath)
      .then(res => res.json())
      .then((data) => {
        const { times, values, note_labels } = data;
        const processed = { times, values, note_labels };

        setData(processed);
        onDataReady?.(processed);
      })
      .catch(err => console.error("加载 CQT JSON 出错:", err));
  }, [dataPath]);

  const draw = () => {
    if (!canvasRef.current || !data) return;

    const { times, values, note_labels } = data;

    if (
      !Array.isArray(times) || times.length === 0 ||
      !Array.isArray(values) || values.length === 0 ||
      !Array.isArray(note_labels) || note_labels.length === 0
    ) {
      console.warn("HPCPCanvas: invalid data structure", data);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const wrapper = canvas.parentElement;
    const rect = wrapper.getBoundingClientRect();

    const wrapperWidth = rect.width;
    const wrapperHeight = rect.height;

    // ✅ 和 CQT 一样：给底部留空间
    const extraBottomPadding = 45;

    const width = wrapperWidth;
    const height = wrapperHeight - extraBottomPadding;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(wrapperHeight * dpr);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${wrapperHeight}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ✅ 和 CQT 对齐的 margin
    const margin = { left: 60, right: 20, top: 50, bottom: 50 };

    const drawWidth = width - margin.left - margin.right;
    const drawHeight = height - margin.top - margin.bottom;

    const rows = note_labels.length;
    const cols = times.length;

    const cellWidth = drawWidth / cols;
    const cellHeight = drawHeight / rows;

    const xScale = (i) => margin.left + i * cellWidth;
    const yScale = (i) => margin.top + drawHeight - (i + 1) * cellHeight;

    if (!colorScale) {
      console.warn("HPCPCanvas: missing colorScale");
      return;
    }

    // ====================
    // 🎨 绘制 HPCP
    // ====================
    for (let t = 0; t < cols; t++) {
      for (let p = 0; p < rows; p++) {
        const v = values[t][p]; // ⚠️ HPCP 结构
        ctx.fillStyle = colorScale(v);
        ctx.fillRect(
          xScale(t),
          yScale(p),
          Math.max(1, cellWidth + 1),
          Math.max(1, cellHeight + 1)
        );
      }
    }

    // ====================
    // 📍 纵轴（显示全部 labels）
    // ====================
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    note_labels.forEach((note, i) => {
      const y = yScale(i) + cellHeight / 2;
      ctx.fillText(note, margin.left - 5, y);
    });

    // 纵轴标题
    ctx.font = "18px sans-serif";
    ctx.save();
    ctx.translate(12, margin.top + drawHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Pitch Class", 0, 0);
    ctx.restore();

    // ====================
    // ⏱ 横轴时间刻度
    // ====================
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const timeStep = 5;
    const duration = times[times.length - 1];

    for (let t = 0; t <= duration; t += timeStep) {
      const frameIndex = times.findIndex(time => time >= t);
      if (frameIndex >= 0) {
        const x = xScale(frameIndex);
        ctx.fillText(`${t}s`, x, margin.top + drawHeight + 10);
      }
    }

    ctx.font = "18px sans-serif";
    ctx.fillText(
      "Time",
      margin.left + drawWidth / 2,
      margin.top + drawHeight + 35
    );

    // ====================
    // 📏 坐标轴线
    // ====================
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + drawHeight);

    ctx.moveTo(margin.left, margin.top + drawHeight);
    ctx.lineTo(margin.left + drawWidth, margin.top + drawHeight);

    ctx.stroke();
  };

  // 初次绘制 + 数据变化
  useEffect(() => {
    draw();
  }, [data, colorScale]);

  // resize
  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data, colorScale]);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
}