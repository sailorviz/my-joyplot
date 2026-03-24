import { useEffect, useRef, useState } from "react";
import scrollama from "scrollama";
import HPCPIllustration from "../sections/top50Songs/HPCPIllustration";
import "../styles/hpcpIllustration.css";
import ReactMarkdown from "react-markdown";

export default function ScrollForHPCPIllustration() {
  const baseRef = useRef(null);
  const [featureSteps, setFeatureSteps] = useState([]);
  const scrollerRef = useRef(null);

  useEffect(() => {
    // 从 public 文件夹中加载 Markdown 文件
    fetch("/data/top50songs-feature-hpcp-illustration-text.md")
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
        step: ".scrollingTextEndStep-hpcpIllustration, .triggerStep-hpcpIllustration", 
        offset: 0.5,
        debug: false
      })
      .onStepEnter(({ element, direction }) => {
        // if (element.classList.contains("scrollingTextEndStep-hpcpIllustration") && direction === "down") {
        //   const step = Number(element.dataset.step);
        //   baseRef.current.setIllustrationStep(step);
        // }
        if (element.classList.contains("triggerStep-hpcpIllustration") && direction === "down") {
          const step = Number(element.dataset.step);
          baseRef.current.setIllustrationStep(step);
        }
      })
      .onStepExit(({ element, direction }) => {
        // if (element.classList.contains("scrollingTextEndStep-hpcpIllustration") && direction === "up") {
        //   const step = Number(element.dataset.step);
        //   if (step !== 0) {
        //     baseRef.current.setIllustrationStep(step - 1);
        //   }
        // }
        if (element.classList.contains("triggerStep-hpcpIllustration") && direction === "up") {
          const step = Number(element.dataset.step);
          if (step !== 0) {
            baseRef.current.setIllustrationStep(step - 1);
          }
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
    <div className="hpcpIllustration full-screen">

      <div className="text-hpcpIllustration">
        <ReactMarkdown>{featureSteps[0]}</ReactMarkdown>
      </div>

      <div className="scrolly">
        <div className="hpcpIllustration-stickyContainer">
          <HPCPIllustration ref={baseRef} />
        </div>

        <div className="hpcpIllustration-steps">
          {/* <div className="scrollingTextContainer-hpcpIllustration">
            <div className="scrolling-text-hpcpIllustration">
              <ReactMarkdown>{featureSteps[0]}</ReactMarkdown>
            </div>
            <div className="scrollingTextEndStep-hpcpIllustration" data-step="0"></div>
          </div> */}

          <div className="triggerStep-hpcpIllustration" data-step="1"></div>
          <div className="triggerStep-hpcpIllustration" data-step="2"></div>
          <div className="triggerStep-hpcpIllustration" data-step="3"></div>
          <div className="triggerStep-hpcpIllustration" data-step="4"></div>
          <div className="triggerStep-hpcpIllustration" data-step="5"></div>
        </div>
      </div>

      <div className="text-hpcpIllustration">
        <ReactMarkdown>{featureSteps[1]}</ReactMarkdown>
      </div>

      {/* <div style={{ height: '100vh', pointerEvents: 'auto' }} /> */}
    </div>
  );
}
