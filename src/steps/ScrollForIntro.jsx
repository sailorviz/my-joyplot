import { useEffect, useRef, useState } from "react";
import scrollama from "scrollama";
import "../styles/intro.css";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";  // 👈 新增
import { useLanguage } from "../components/LanguageContext";

export default function ScrollForIntro(){
  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(null);
  const scrollerRef = useRef(null);
  const { language } = useLanguage(); // 获取当前语言
  const textsUI = {
      zh: { 
          projectName: '皮皮帆的音乐自画像',  // 或者 '皮皮帆·音乐自画像'
          creatorName: '来自 皮皮帆' 
      },
      en: { 
          projectName: "Macy's Musical Self-Portrait",
          creatorName: 'By Macy Yang' 
      }
  };
  
  useEffect(() => {
    // 根据语言动态拼接路径
    const url = `/data/text/${language}/intro-texts.md`;
    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        const blocks = text
          .split(/<!--\s*step\d+\s*-->/gm)
          .filter((block) => block.trim().length > 0)
          .map((block) => block.trim());
        setSteps(blocks);
      })
      .catch((err) => console.error("加载 Markdown 出错:", err));
  }, [language]);

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
        <h1 className="title">{textsUI[language].projectName}</h1>
          <p className="subtitle"></p>
          <p className="author">{textsUI[language].creatorName}</p>
          <p className="published-time"></p>
        </div>

        {activeStep !== null && activeStep >= 0 && steps[activeStep] && (
          <div className={`scroll-intro fade-in`}>
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
              {steps[activeStep]}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <div className="trigger-step"></div>
      <div className="trigger-step"></div>
      <div className="trigger-step"></div>
      <div className="trigger-step"></div>
    </div>
  );
}
