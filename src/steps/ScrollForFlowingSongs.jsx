import { useEffect, useRef } from "react";
import scrollama from "scrollama";
import FloatingSongs from "../sections/FlowingSongs/FloatingSongs";

export default function ScrollForFlowingSongs() {
  const floatingRef = useRef(null);

  useEffect(() => {
    const scroller = scrollama();

    scroller
      .setup({
        step: ".step",
        offset: 0.7, // 当触发器进入视口 70% 时触发
        debug: true,
      })
      .onStepEnter((response) => {
        console.log("Step Enter:", response.index);
        if (response.index === 0) {
          floatingRef.current?.triggerClustering();
        }
      });

    window.addEventListener("resize", scroller.resize);
    return () => window.removeEventListener("resize", scroller.resize);
  }, []);

  return (
    <div style={{ height: "250vh", position: "relative" }}>
      <FloatingSongs ref={floatingRef} />
      <div
        className="step"
        style={{
          position: "absolute",
          top: "150vh", // 第二屏时触发
          width: "100%",
          height: "50vh",
          background: "transparent", // 可设为半透明便于调试
        }}
      ></div>
    </div>
  );
}
