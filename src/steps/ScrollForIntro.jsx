import { useEffect, useRef, useState } from "react";
import scrollama from "scrollama";
import "../styles/intro.css";
import ReactMarkdown from "react-markdown";

export default function ScrollForIntro(){
  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(null);
  const scrollerRef = useRef(null);
  
  useEffect(() => {
    // 从 public 文件夹中加载 Markdown 文件
    fetch("/data/intro-texts.md")
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

  console.log(steps);


  useEffect(() => {
    if (steps.length === 0) return; // 👈 没加载完就不 setup
    scrollerRef.current = scrollama();
  
    scrollerRef.current
      .setup({
        step: ".trigger-step", // 文字底部 + 后续触发点
        offset: 0.5,
        debug: false
      })
      .onStepEnter(({ index, direction }) => {
        if (direction === "down") {
          setActiveStep(index);
        }
      })
      .onStepExit(({ index, direction }) => {
        if (direction === "up") {
          setActiveStep(index - 1);
        }
      });
  
    // window.addEventListener("resize", scrollerRef.current.resize);
    // 窗口变化
    const handleResize = () => scrollerRef.current?.resize();
    window.addEventListener("resize", handleResize);

    // return () => window.removeEventListener("resize", handleResize);
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
    <div className="intro full-screen">
      <div className="sticky-container">
        <div className="sticky-headline">
          <h1 className="title">Macy's Music Portrait</h1>
          <p className="subtitle"></p>
          <p className="author">By MacyYang</p>
          <p className="published-time"></p>
        </div>

        <div className={`scroll-intro ${steps[activeStep] ? "fade-in" : "fade-out"}`}>
          <ReactMarkdown>{steps[activeStep]}</ReactMarkdown>
        </div>
      </div>

      <div className="trigger-step"></div>
      <div className="trigger-step"></div>
    </div>
  );
}
