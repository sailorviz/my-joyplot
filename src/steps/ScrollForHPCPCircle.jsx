import { useEffect, useRef, useState } from "react";
import scrollama from "scrollama";
import HPCPCircle from "../sections/top50Songs/HPCPCircle";
import "../styles/hpcpCircle.css";
import ReactMarkdown from "react-markdown";

export default function ScrollForHPCPCircle() {
  const baseRef = useRef(null);
  const [textSteps, setTextSteps] = useState([]);
  const [featureSteps, setFeatureSteps] = useState([]);
  const scrollerRef = useRef(null);
  
  // 从 public 文件夹中加载 单独text 文件
  useEffect(() => {    
    fetch("/data/top50songs-feature-hpcp-circle-text-1.md")
      .then((res) => res.text())
      .then((text) => {
        // 按标题（# step）分段
        const blocks = text
          .split(/^#\s+(?=step\d+)/gm)
          .filter((t) => t.trim().length > 0)
          .map((t) => `# ${t.trim()}`); // 补回 #
        setTextSteps(blocks);
      })
      .catch((err) => console.error("加载 单独text 出错:", err));
  }, []);

  // 从 public 文件夹中加载 circle组件内text 文件
  useEffect(() => {    
    fetch("/data/top50songs-feature-hpcp-circle-text-2.md")
      .then((res) => res.text())
      .then((text) => {
        // 按标题（# step）分段
        const blocks = text
          .split(/^#\s+(?=step\d+)/gm)
          .filter((t) => t.trim().length > 0)
          .map((t) => `# ${t.trim()}`); // 补回 #
        setFeatureSteps(blocks);
      })
      .catch((err) => console.error("加载 circle组件内text 出错:", err));
  }, []);

  useEffect(() => {
    if (!baseRef.current || textSteps.length === 0 || featureSteps.length === 0) return;
    scrollerRef.current = scrollama();

    scrollerRef.current
      .setup({
        step: ".scrollingTextEndStep-hpcpCircle, .triggerStep-hpcpCircle", 
        offset: 0.5,
        debug: false
      })
      .onStepEnter(({ element, index, direction }) => {
        if (element.classList.contains("scrollingTextEndStep-hpcpCircle") && direction === "down") {
          switch (index) {
            case 0:
              baseRef.current.zoomToDissonanceKDE();
              break;
              default:
              break;
          }
        }
        // if (element.classList.contains("triggerStep-hpcpCircle") && direction === "down") {
        // }
      })
      .onStepExit(({ element, direction }) => {
        if (element.classList.contains("scrollingTextEndStep-hpcpCircle") && direction === "up") {
          switch (index) {
            case 0:
              baseRef.current.zoomToDissonanceKDE();
              break;
              default:
              break;
          }
        }
        // if (element.classList.contains("triggerStep-hpcpCircle") && direction === "up") {
        // }
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
  }, [textSteps]);

  return (
    <div className="hpcpCircle full-screen">

      <div className="text-hpcpCircle">
        <ReactMarkdown>{textSteps[0]}</ReactMarkdown>
      </div>

      <div className="scrolly">
        <div className="hpcpCircle-stickyContainer">
          <HPCPCircle ref={baseRef} />
        </div>

        <div className="scrollingTextContainer-hpcpCircle">
          <div className="scrolling-text-hpcpCircle">
            <ReactMarkdown>{featureSteps[0]}</ReactMarkdown>
          </div>
          <div className="scrollingTextEndStep-hpcpCircle"></div>
        </div>        
      </div>

      <div className="text-hpcpCircle">
        <ReactMarkdown>{textSteps[1]}</ReactMarkdown>
      </div>

      {/* <div style={{ height: '100vh', pointerEvents: 'auto' }} /> */}
    </div>
  );
}
