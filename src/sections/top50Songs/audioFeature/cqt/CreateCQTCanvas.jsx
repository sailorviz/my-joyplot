import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { interpolateInferno } from "d3-scale-chromatic";

const CreateCQTCanvas = forwardRef(({ dataPath, onDataReady }, ref) => {
  const canvasRef = useRef(null);
  const plotAreaRef = useRef(null);
  const [cqtData, setCqtData] = useState(null);
  const dataRef = useRef(null);

  // 加载数据
  useEffect(() => {
    if (!dataPath) return;

    let isCancelled = false;

    fetch(dataPath)
      .then(res => res.json())
      .then((data) => {
        if (isCancelled) return;
        const { times, values, note_labels } = data;
        const processed = { times, values, note_labels };

        setCqtData(processed);
        dataRef.current = processed;
        onDataReady?.(processed);
      })
      .catch(err => console.error("加载 CQT JSON 出错:", err));

    return () => { isCancelled = true; };
  }, [dataPath]);

  // 清空旧数据
  useEffect(() => {
    setCqtData(null);
  }, [dataPath]);

  // ==================== 核心：绘制 + 自适应 ====================
  const draw = () => {
    if (!canvasRef.current || !cqtData) return;

    const { times, values, note_labels } = cqtData;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const wrapper = canvas.parentElement;
    const rect = wrapper.getBoundingClientRect();

    const wrapperWidth = rect.width;
    const wrapperHeight = rect.height;

    // 🔥 关键修复：给底部额外留 30-40px 空间给 "Time" 文字
    const extraBottomPadding = 45;   // 可根据字体大小微调（18px 字体建议 40~50）

    const width = wrapperWidth;
    const height = wrapperHeight - extraBottomPadding;   // 缩小实际绘制高度

    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor((wrapperHeight) * dpr);   // Canvas 本身还是填满 wrapper

    canvas.style.width = `${width}px`;
    canvas.style.height = `${wrapperHeight}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const margin = { left: 60, right: 20, top: 20, bottom: 20 }; // bottom 加大一点

    const drawWidth = width - margin.left - margin.right;
    const drawHeight = height - margin.top - margin.bottom;     // 使用缩小后的 height

    // 保存给外部使用的 plotArea
    plotAreaRef.current = {
      left: margin.left,
      top: margin.top,
      width: drawWidth,
      height: drawHeight,
      frameCount: times.length,
      binCount: note_labels.length
    };

    const frameWidth = drawWidth / times.length;
    const xScale = (i) => margin.left + i * frameWidth;
    const yScale = (i) => margin.top + drawHeight - ((i + 1) / note_labels.length) * drawHeight;

    // 颜色映射
    const flatValues = values.flat();
    const minVal = Math.min(...flatValues);
    const maxVal = Math.max(...flatValues);
    const valueToColor = (v) => {
      const norm = (v - minVal) / (maxVal - minVal || 1);
      return interpolateInferno(norm);
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制 Spectrogram
    const binWidth = Math.max(1, drawWidth / times.length);
    const binHeight = Math.max(1, drawHeight / note_labels.length);

    for (let frame = 0; frame < times.length; frame++) {
      for (let bin = 0; bin < note_labels.length; bin++) {
        ctx.fillStyle = valueToColor(values[frame][bin]);
        ctx.fillRect(
          xScale(frame),
          yScale(bin),
          binWidth + 1,
          binHeight + 1
        );
      }
    }

    // 绘制坐标轴（保持你原来的逻辑）
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    note_labels.forEach((note, i) => {
      if (/^C[2-7]$/.test(note)) {
        const y = yScale(i) + binHeight / 2;
        ctx.fillText(note, margin.left - 5, y);
      }
    });

    // 纵轴标题
    ctx.font = "18px sans-serif";
    ctx.save();
    ctx.translate(12, margin.top + drawHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Pitch", 0, 0);
    ctx.restore();

    // 横轴刻度
    ctx.font = "18px sans-serif";
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

    ctx.fillText("Time", margin.left + drawWidth / 2, margin.top + drawHeight + 38);  // 关键：下移

    // 轴线
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + drawHeight);
    ctx.moveTo(margin.left, margin.top + drawHeight);
    ctx.lineTo(margin.left + drawWidth, margin.top + drawHeight);
    ctx.stroke();
  };

  // 数据变化或窗口大小变化时重绘
  useEffect(() => {
    draw();
  }, [cqtData]);

  // 窗口 resize 监听
  useEffect(() => {
    const handleResize = () => {
      draw();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cqtData]);   // 依赖 cqtData，确保有数据时才响应

  useImperativeHandle(ref, () => ({
    getCanvasRect: () => canvasRef.current?.getBoundingClientRect(),
    getPlotArea: () => plotAreaRef.current,
    getFrame: (i) => dataRef.current?.values?.[i] || null,
    getFrameTimes: () => dataRef.current?.times || null,
    getNoteLabels: () => dataRef.current?.note_labels || [],
  }));

  return (
    <canvas
      ref={canvasRef}
      className="cqt-spectrogram-canvas"
    />
  );
});

export default CreateCQTCanvas;
