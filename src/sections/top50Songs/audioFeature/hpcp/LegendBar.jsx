import React, { useRef, useEffect } from "react";

export default function LegendBar({
  colorScale,
  domain,
  height = 12,
  label = ""
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!colorScale || !domain) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const [min, max] = domain;

    const steps = 100;

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const value = min + t * (max - min);

      ctx.fillStyle = colorScale(value);
      ctx.fillRect(
        t * width,
        0,
        width / steps + 1,
        height
      );
    }

  }, [colorScale, domain, height]);

  return (
    <div className="energy-bar" style={{ display: "inline-block" }}>
      {label && (
        <div style={{ fontSize: 12, marginBottom: 4 }}>
          {label}
        </div>
      )}
      <canvas ref={canvasRef} />
    </div>
  );
}