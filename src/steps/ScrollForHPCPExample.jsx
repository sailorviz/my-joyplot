import { useEffect, useRef, useState } from "react";
import scrollama from "scrollama";
import HPCPExample from "../sections/top50Songs/HPCPExample";
import "../styles/hpcpExample.css";
import ReactMarkdown from "react-markdown";

export default function ScrollForHPCPExample() {
  const baseRef = useRef(null);
  const [featureSteps, setFeatureSteps] = useState([]);
  const scrollerRef = useRef(null);
  const [currentText, setCurrentText] = useState(featureSteps[0]);

  useEffect(() => {
    // 从 public 文件夹中加载 Markdown 文件
    fetch("/data/top50songs-feature-hpcp-example-text.md")
      .then((res) => res.text())
      .then((text) => {
        // 按标题（# step）分段
        const blocks = text
          .split(/^#\s+(?=step\d+)/gm)
          .filter((t) => t.trim().length > 0)
          .map((t) => `# ${t.trim()}`); // 补回 #
        setFeatureSteps(blocks);
      })
      .catch((err) => console.error("加载 Markdown 出错:", err));
  }, []);

  useEffect(() => {
    if (!baseRef.current || featureSteps.length === 0) return;
    scrollerRef.current = scrollama();

    scrollerRef.current
      .setup({
        step: ".scrollingTextEndStep-hpcp-example, .triggerStep-hpcp-example", 
        offset: 0.5,
        debug: false
      })
      .onStepEnter(({ element, index, direction }) => {
        // if (element.classList.contains("scrollingTextEndStep-hpcp-example") && direction === "down") {
        //   switch (index) {
        //     case 0:
        //       baseRef.current.pause();
        //       baseRef.current.triggerPlottingTimelineForSongs();
        //       break;
        //       default:
        //       break;
        //   }
        // }
        if (element.classList.contains("triggerStep-hpcp-example") && direction === "down") {
          // 1️⃣ 更新右侧文字
          setCurrentText(featureSteps[index]);
        }
      })
      .onStepExit(({ element, index, direction }) => {
        // if (element.classList.contains("scrollingTextEndStep-hpcp-example") && direction === "up") {
        //   switch (index) {
        //     case 0:
        //       baseRef.current.backToBaseSquares();
        //       break;
        //     default:
        //       break;
        //   }
        // }
        if (element.classList.contains("triggerStep-hpcp-example") && direction === "up") {
          // 1️⃣ 更新右侧文字
          if (index !== 0){
            setCurrentText(featureSteps[index - 1]);
          } else {
            setCurrentText(null);
          }
          
          // // 3️⃣ 根据 index 特殊处理组件
          // switch (index) {
          //   case 1:
          //     // console.log("step1");
          //     baseRef.current?.hideCaptureBox();  
          //     break;       
          //   default:
          //     break;
          // }
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
  }, [featureSteps]);

  return (
    <div className="hpcp-example full-screen">

      <div className="hpcp-example-stickyContainer">
        <HPCPExample ref={baseRef} />

        <div className="hpcp-example-right">
          <div className="hpcp-example-text">
            <ReactMarkdown>{currentText}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Scroll triggers */}
      {featureSteps.map((_, i) => (
        <div key={i} className="triggerStep-hpcp-example" />
      ))}

      <div style={{ height: '100vh', pointerEvents: 'auto' }} />
    </div>
  );
}
