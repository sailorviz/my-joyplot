import { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function HPCPCanvas({ data, width = 400, height = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const rows = 12;               // HPCP 12 音高
    const cols = data[0].length;   // 时间步
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    ctx.clearRect(0, 0, width, height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const value = data[r][c];
        ctx.fillStyle = d3.interpolateViridis(value);
        ctx.fillRect(c * cellWidth, height - (r + 1) * cellHeight, cellWidth, cellHeight);
      }
    }
  }, [data, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ background: "#111" }} />;
}