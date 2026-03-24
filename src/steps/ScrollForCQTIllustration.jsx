import { useEffect, useRef, useState } from "react";
import scrollama from "scrollama";
import CQTIllustration from "../sections/top50Songs/CQTIllustration";
import "../styles/cqtIllustration.css";
import ReactMarkdown from "react-markdown";

export default function ScrollForCQTIllustration() {
  const baseRef = useRef(null);
  const [featureSteps, setFeatureSteps] = useState([]);
  const scrollerRef = useRef(null);

  useEffect(() => {
    // 从 public 文件夹中加载 Markdown 文件
    fetch("/data/top50songs-feature-cqt-illustration-text.md")
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
        step: ".scrollingTextEndStep-cqtIllustration, .triggerStep-cqtIllustration", 
        offset: 0.5,
        debug: false
      })
      .onStepEnter(({ element, direction }) => {
        // if (element.classList.contains("scrollingTextEndStep-cqtIllustration") && direction === "down") {
        //   const step = Number(element.dataset.step);
        //   baseRef.current.setIllustrationStep(step);
        // }
        if (element.classList.contains("triggerStep-cqtIllustration") && direction === "down") {
          const step = Number(element.dataset.step);
          baseRef.current.setIllustrationStep(step);
        }
      })
      .onStepExit(({ element, direction }) => {
        // if (element.classList.contains("scrollingTextEndStep-cqtIllustration") && direction === "up") {
        //   const step = Number(element.dataset.step);
        //   if (step !== 0) {
        //     baseRef.current.setIllustrationStep(step - 1);
        //   }
        // }
        if (element.classList.contains("triggerStep-cqtIllustration") && direction === "up") {
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
    <div className="cqtIllustration full-screen">

      <div className="text-cqtIllustration">
        <ReactMarkdown>{featureSteps[0]}</ReactMarkdown>
      </div>

      <div className="scrolly">
        <div className="cqtIllustration-stickyContainer">
          <CQTIllustration ref={baseRef} />
        </div>

        <div className="cqtIllustration-steps">
          {/* <div className="scrollingTextContainer-cqtIllustration">
            <div className="scrolling-text-cqtIllustration">
              <ReactMarkdown>{featureSteps[0]}</ReactMarkdown>
            </div>
            <div className="scrollingTextEndStep-cqtIllustration" data-step="0"></div>
          </div> */}

          <div className="triggerStep-cqtIllustration" data-step="1"></div>
          <div className="triggerStep-cqtIllustration" data-step="2"></div>
          <div className="triggerStep-cqtIllustration" data-step="3"></div>
          <div className="triggerStep-cqtIllustration" data-step="4"></div>
          <div className="triggerStep-cqtIllustration" data-step="5"></div>
        </div>
      </div>

      <div className="text-cqtIllustration">
        <ReactMarkdown>{featureSteps[1]}</ReactMarkdown>
      </div>

      {/* <div style={{ height: '100vh', pointerEvents: 'auto' }} /> */}
    </div>
  );
}
