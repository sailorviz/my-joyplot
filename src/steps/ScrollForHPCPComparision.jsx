import { useEffect, useRef, useState } from "react";
import scrollama from "scrollama";
import HPCPComparision from "../sections/top50Songs/HPCPComparision";
import "../styles/hpcp.css";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "../components/LanguageContext";

export default function ScrollForHPCPComparision() {
  const baseRef = useRef(null);
  const [featureSteps, setFeatureSteps] = useState([]);
  const scrollerRef = useRef(null);
  const [currentText, setCurrentText] = useState(null);
  const { language } = useLanguage(); // 获取当前语言

  useEffect(() => {
    // 从 public 文件夹中加载 Markdown 文件
    const url = `/data/text/${language}/top50songs-feature-hpcp-comparision-text.md`;
    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        const blocks = text
          .split(/<!--\s*step\d+\s*-->/gm)
          .filter((block) => block.trim().length > 0)
          .map((block) => block.trim());
        setFeatureSteps(blocks);
        // console.log(blocks);
      })
      .catch((err) => console.error("加载 Markdown 出错:", err));
  }, []);

  useEffect(() => {
    // if (!baseRef.current || featureSteps.length === 0) return;
    console.log("featureSteps.length:", featureSteps.length);
    console.log("baseRef.current:", baseRef.current);
  
    if (!baseRef.current || featureSteps.length === 0) {
      console.log("条件不满足，跳过初始化");
    return;
  }
  
  console.log("开始初始化 scrollama");
    scrollerRef.current = scrollama();

    scrollerRef.current
      .setup({
        step: ".scrollingTextEndStep-hpcp-comparision, .triggerStep-hpcp-comparision", 
        offset: 0.5,
        debug: false
      })
      .onStepEnter(({ element, index, direction }) => {
        // if (element.classList.contains("scrollingTextEndStep-hpcp-comparision") && direction === "down") {
        //   switch (index) {
        //     case 0:
        //       baseRef.current.pause();
        //       baseRef.current.triggerPlottingTimelineForSongs();
        //       break;
        //       default:
        //       break;
        //   }
        // }
        if (element.classList.contains("triggerStep-hpcp-comparision") && direction === "down") {
          // 1️⃣ 更新右侧文字
          if (featureSteps[index]) {
            setCurrentText(featureSteps[index]);
            const currentText = featureSteps[index];
            console.log(currentText);
          } else {
            console.log("current text 不存在");
          }
        }
      })
      .onStepExit(({ element, index, direction }) => {
        // if (element.classList.contains("scrollingTextEndStep-hpcp-comparision") && direction === "up") {
        //   switch (index) {
        //     case 0:
        //       baseRef.current.backToBaseSquares();
        //       break;
        //     default:
        //       break;
        //   }
        // }
        if (element.classList.contains("triggerStep-hpcp-comparision") && direction === "up") {
          // 1️⃣ 更新右侧文字
          if (index !== 0){
            setCurrentText(featureSteps[index - 1]);
          } else {
            setCurrentText(null);
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
    <div className="hpcp-comparision full-screen">

      <div className="hpcp-comparision-stickyContainer">
        <HPCPComparision ref={baseRef} />

        <div className="hpcp-comparision-right">
          <div className="hpcp-comparision-text">
            <ReactMarkdown>{currentText}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Scroll triggers */}
      {featureSteps.map((_, i) => (
        <div key={i} className="triggerStep-hpcp-comparision" />
      ))}

      <div style={{ height: '100vh', pointerEvents: 'auto' }} />
    </div>
  );
}
