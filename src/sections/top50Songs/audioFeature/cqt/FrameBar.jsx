import { useMemo } from "react";
import { interpolateInferno } from "d3-scale-chromatic";

const FrameBar = ({ bins = 72, noteLabels = [], rectWidth = 5, values }) => {

  const colors = useMemo(() => {
    if (!values) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);

    return values.map(v => {
      const norm = (v - min) / (max - min || 1);
      return interpolateInferno(norm);
    });
  }, [values]);

  const isCentralC = (note) => /^C[2-7]$/.test(note);

  return (
    <div className="cqt-framebar-inner">
      {Array.from({ length: bins }).map((_, i) => {
        const pitch = noteLabels[i] || "";
        const color = colors[i] || "transparent";

        return (
          <div
            key={i}
            className="cqt-framebar-rect"
            style={{
              width: rectWidth,
              background: color   // 🔥 直接由数据驱动
            }}
          >
            {isCentralC(pitch) && (
              <span className="framebar-label">{pitch}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FrameBar;