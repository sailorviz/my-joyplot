// import { useRef, forwardRef, useImperativeHandle } from "react";
// import { interpolateInferno } from "d3-scale-chromatic";

// /**
//  * FrameBar
//  * props:
//  *   bins: rect 数量
//  *   noteLabels: 每个 rect 对应的音高 ["C2", "C#2", ...]
//  */
// const FrameBar = forwardRef(({ bins = 72, noteLabels = [], rectWidth = 5 }, ref) => {
//   const rectRefs = useRef([]);

//   // 更新 frame 数据
//   const updateFrame = (values) => {
//     if (!values) return;

//     const min = Math.min(...values);
//     const max = Math.max(...values);

//     values.forEach((v, i) => {
//       const norm = (v - min) / (max - min || 1);
//       const color = interpolateInferno(norm);

//       const rect = rectRefs.current[i];
//       if (rect) rect.style.background = color;
//     });
//   };

//   useImperativeHandle(ref, () => ({
//     updateFrame
//   }));

//   // 判断是否标注文字（只标中央 C 或每 octave 的 C）
//   const isCentralC = (note) => /^C[2-7]$/.test(note);

//   return (
//     <div className="cqt-framebar">
//       {Array.from({ length: bins }).map((_, i) => {
//         const pitch = noteLabels[i] || "";
//         return (
//           <div
//             key={i}
//             ref={(el) => (rectRefs.current[i] = el)}
//             className={`cqt-framebar-rect`}
//             style={{ width: rectWidth }}
//             data-pitch={pitch}
//             data-index={i}
//           >
//             {isCentralC(pitch) && (
//               <span className="framebar-label">{pitch}</span>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// });

// export default FrameBar;

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
    <div className="cqt-framebar">
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