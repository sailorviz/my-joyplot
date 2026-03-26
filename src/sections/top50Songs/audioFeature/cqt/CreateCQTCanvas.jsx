import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { interpolateInferno } from "d3-scale-chromatic";

/**
 * CQTCanvasFromJSONColorAdaptive
 * 彩色 CQT + 自适应宽度 + 高度固定
 */
const CreateCQTCanvas = forwardRef(({ dataPath, onDataReady }, ref) => {
  const canvasRef = useRef(null);
  const plotAreaRef = useRef(null);
  const [cqtData, setCqtData] = useState(null);
  const dataRef = useRef(null);

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

        onDataReady?.(processed); // ⭐ 通知外层
      })
      .catch(err => console.error("加载 CQT JSON 出错:", err));

    return () => {
      isCancelled = true;
    };
  }, [dataPath]);


  // ⭐ 清空旧数据（关键）
  useEffect(() => {
    setCqtData(null);
  }, [dataPath]);

  // 绘制 spectrogram + xy轴
  useEffect(() => {
    if (!canvasRef.current || !cqtData) return;

    const { times, values, note_labels } = cqtData;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 设置字号
    const tickFont = "14px sans-serif";    // 刻度文字
    const axisFont = "18px sans-serif";    // 轴名

    // Canvas 大小 + 留白
    // const width = canvas.parentElement.clientWidth;
    // const height = 500;
    const rect = canvas.parentElement.getBoundingClientRect();

    console.log("wrapper height:", rect.height);

    const width = rect.width;
    const height = rect.height;   // 🔥 改这里

    const margin = { left: 60, right: 20, top: 20, bottom: 40 };
    const drawWidth = width - margin.left - margin.right;
    const drawHeight = height - margin.top - margin.bottom;

    // canvas.width = width;
    // canvas.height = height + margin.bottom;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;   // ⭐⭐⭐ 去掉 + margin.bottom

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height + margin.bottom}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    plotAreaRef.current = {
      left: margin.left,
      top: margin.top,
      width: drawWidth,
      height: drawHeight,
      frameCount: times.length,
      binCount: note_labels.length
    };

    // 横纵比例
    // const xScale = (i) => margin.left + (i / (times.length - 1)) * drawWidth;
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

    const binWidth = Math.max(1, drawWidth / times.length);
    const binHeight = Math.max(1, drawHeight / note_labels.length);

    ctx.clearRect(0, 0, width, height + margin.bottom);

    // ------------------
    // 绘制 spectrogram
    // ------------------
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

    // ------------------
    // 绘制纵轴 pitch
    // ------------------
    ctx.font = tickFont;
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    note_labels.forEach((note, i) => {
      if (/^C[2-7]$/.test(note)) { // C2 ~ C7
        const y = yScale(i) + binHeight / 2;
        ctx.fillText(note, margin.left - 5, y);
      }
    });

    // 纵轴名字 Pitch
    ctx.font = axisFont;   // 轴名字号更大
    ctx.save();
    ctx.translate(10, margin.top + drawHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Pitch", 0, 0);
    ctx.restore();

    // ------------------
    // 绘制横轴刻度 time
    // ------------------
    ctx.font = tickFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const timeStep = 5; // 每5s一格
    const duration = times[times.length - 1];
    for (let t = 0; t <= duration; t += timeStep) {
      const frameIndex = times.findIndex((time) => time >= t);
      if (frameIndex >= 0) {
        const x = xScale(frameIndex);
        // ctx.fillText(`${t}s`, x, height - 30);
        ctx.fillText(`${t}s`, x, margin.top + drawHeight + 5);
      }
    }

    // 横轴名字 Time
    ctx.font = axisFont;
    ctx.fillText("Time", margin.left + drawWidth / 2, height);

    // ------------------
    // 绘制轴线
    // ------------------
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;

    // 左纵轴
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + drawHeight);
    ctx.stroke();

    // 底横轴
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + drawHeight);
    ctx.lineTo(margin.left + drawWidth, margin.top + drawHeight);
    ctx.stroke();

  }, [cqtData]);

  useImperativeHandle(ref, () => ({
    getCanvasRect: () => {
      return canvasRef.current.getBoundingClientRect();
    },

    getPlotArea: () => {
      return plotAreaRef.current;
    },
    
    getFrame: (i) => {
      return dataRef.current?.values?.[i] || null;
    },

    getFrameTimes: () => {
      return dataRef.current?.times|| null;
    },

    getNoteLabels: () => {
      return dataRef.current?.note_labels || [];
    }
  }));

  return (
    <canvas
      ref={canvasRef}
      className="cqt-spectrogram-canvas"
    />
  );
});

export default CreateCQTCanvas;

