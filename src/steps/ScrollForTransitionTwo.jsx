import { useEffect, useState, useRef } from "react";
import scrollama from "scrollama";
import "../styles/transitionOne.css";
import ReactMarkdown from "react-markdown";

export default function ScrollForTransitionTwo({ onContinue, onGoBack }){
  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const scrollerRef = useRef(null);
  
  useEffect(() => {
    // 从 public 文件夹中加载 Markdown 文件
    fetch("/data/transitionTwo.md")
      .then((res) => res.text())
      .then((text) => {
        // 按标题（# step）分段
        const blocks = text
          .split(/^#\s+(?=step\d+)/gm)
          .filter((t) => t.trim().length > 0)
          .map((t) => `# ${t.trim()}`); // 补回 #
        setSteps(blocks);
      })
      .catch((err) => console.error("加载 Markdown 出错:", err));
  }, []);


  useEffect(() => {
    if (steps.length === 0) return; // 👈 没加载完就不 setup
    scrollerRef.current = scrollama();
  
    scrollerRef.current
      .setup({
        step: ".trigger-step-transition-two", // 文字底部 + 后续触发点
        offset: 0.5,
        debug: false
      })
      .onStepEnter(({ index, direction }) => {
        if (direction === "down") {
          setActiveStep(index + 1);
        }
      })
      .onStepExit(({ index, direction }) => {
        if (direction === "up") {
          setActiveStep(index);
        }
      });
  
    const handleResize = () => scrollerRef.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      // 必须清理！！
      if (scrollerRef.current) {
        scrollerRef.current.destroy();
        scrollerRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
    }; 
  }, [steps]);

  return(
    <div className="transition-two full-screen">
      <div className="sticky-container">
        <div className={`scroll-text ${steps[activeStep] ? "fade-in" : "fade-out"}`}>
          <ReactMarkdown>{steps[activeStep]}</ReactMarkdown>
          {activeStep === steps.length - 1 && (
            <div className="buttons">
              <button onClick={onContinue}>Continue to read</button>
              <button onClick={onGoBack}>Go back to beginning</button>
            </div>
          )}
        </div>
      </div>
      {/* 全局类名污染 —— .trigger-step 被所有组件共用，
      scrollama 一视同仁全扫进来,要给每一个组件单独设置类名！！！ */}
      <div className="trigger-step-transition-two"></div>
      <div className="trigger-step-transition-two"></div>
      <div className="trigger-step-transition-two"></div>
    </div>
  );
}