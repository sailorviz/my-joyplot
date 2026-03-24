import { useRef, useEffect } from "react";

export default function CQTCanvas({ data, width = 300, height = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制 CQT 数据
    if (data) {
      const rows = data.length;
      const cols = data[0].length;

      const cellWidth = width / cols;
      const cellHeight = height / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const value = data[r][c]; // 0~1
          ctx.fillStyle = `rgb(${value * 255}, ${value * 255}, ${value * 255})`;
          ctx.fillRect(c * cellWidth, height - (r + 1) * cellHeight, cellWidth, cellHeight);
        }
      }
    }
  }, [data, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} />;
}