import { useEffect, useRef, useState } from "react";
import scrollama from "scrollama";
import BaseCQT from "../sections/top50Songs/BaseCQT";
import "../styles/cqt.css";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "../components/LanguageContext";

export default function ScrollForCQT() {
  const baseRef = useRef(null);
  const [featureSteps, setFeatureSteps] = useState([]);
  const scrollerRef = useRef(null);
  const [currentText, setCurrentText] = useState(featureSteps[0]);
  const { language } = useLanguage(); // 获取当前语言

  useEffect(() => {
    // 从 public 文件夹中加载 Markdown 文件
    const url = `/data/text/${language}/top50songs-feature-cqt-text.md`;
    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        const blocks = text
          .split(/<!--\s*step\d+\s*-->/gm)
          .filter((block) => block.trim().length > 0)
          .map((block) => block.trim());
        setFeatureSteps(blocks);
      })
      .catch((err) => console.error("加载 Markdown 出错:", err));
  }, []);

  useEffect(() => {
    if (!baseRef.current || featureSteps.length === 0) return;
    scrollerRef.current = scrollama();

    scrollerRef.current
      .setup({
        step: ".scrollingTextEndStep-cqt, .triggerStep-cqt", 
        offset: 0.5,
        debug: false
      })
      .onStepEnter(({ element, index, direction }) => {
        // if (element.classList.contains("scrollingTextEndStep-cqt") && direction === "down") {
        //   switch (index) {
        //     case 0:
        //       baseRef.current.pause();
        //       baseRef.current.triggerPlottingTimelineForSongs();
        //       break;
        //       default:
        //       break;
        //   }
        // }
        if (element.classList.contains("triggerStep-cqt") && direction === "down") {
          // 1️⃣ 更新右侧文字
          setCurrentText(featureSteps[index]);

          // 3️⃣ 根据 index 特殊处理组件
          switch (index) {
            case 1:
              // console.log("step1");
              baseRef.current?.showCaptureBox();  // 显示 capture box
              break;
            case 2:
              baseRef.current?.showFirstFrame();  
              break;
            case 4:
              baseRef.current?.hideCaptureBox();
              baseRef.current?.showPlayhead();
              baseRef.current?.showPlayButton();  
              baseRef.current?.showOverlay(); 
              baseRef.current?.showPulse(); // beats效果依赖RAF，每帧检查state, REACT异步更新延迟明显，所以在case7前提前设置。
              break;
            case 6:
              baseRef.current?.resetPlayback();
              break;
            case 8:
              baseRef.current?.enterExploreMode();
              break;
            default:
              break;
          }
        }
      })
      .onStepExit(({ element, index, direction }) => {
        // if (element.classList.contains("scrollingTextEndStep-cqt") && direction === "up") {
        //   switch (index) {
        //     case 0:
        //       baseRef.current.backToBaseSquares();
        //       break;
        //     default:
        //       break;
        //   }
        // }
        if (element.classList.contains("triggerStep-cqt") && direction === "up") {
          // 1️⃣ 更新右侧文字
          if (index !== 0){
            setCurrentText(featureSteps[index - 1]);
          } else {
            setCurrentText(null);
          }
          
          // 3️⃣ 根据 index 特殊处理组件
          switch (index) {
            case 1:
              // console.log("step1");
              baseRef.current?.hideCaptureBox();  
              break;
            case 2:
              baseRef.current?.hideFrameBar();  
              break;
            case 4:
              baseRef.current?.resetPlayback();
              baseRef.current?.showCaptureBox();
              baseRef.current?.hidePlayhead();
              baseRef.current?.hidePlayButton();  
              baseRef.current?.hideOverlay(); 
              break;
            case 6:
              baseRef.current?.resetPlayback();
              baseRef.current?.hidePulse(); // 这里也是一样，需要在回到case4之前就提前设置state。
              break;
            case 8:
              baseRef.current?.exitExploreMode();
              baseRef.current?.backToDefaultedSong();
              break;          
            default:
              break;
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
    <div className="cqt full-screen">

      <div className="cqt-stickyContainer">
        <BaseCQT ref={baseRef} />

        <div className="cqt-right">
          <div className="cqt-text">
            <ReactMarkdown>{currentText}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Scroll triggers */}
      {featureSteps.map((_, i) => (
        <div key={i} className="triggerStep-cqt" />
      ))}

      <div style={{ height: '100vh', pointerEvents: 'auto' }} />
    </div>
  );
}
