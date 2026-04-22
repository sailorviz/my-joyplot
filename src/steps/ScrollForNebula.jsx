import { useEffect, useRef, useState } from "react";
import Nebula from "../sections/nebula/Nebula";
import "../styles/nebula.css";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "../components/LanguageContext";

export default function ScrollForNebula() {
  const nebulaRef = useRef(null);
  const sectionRef = useRef(null);
  const [textSteps, setTextSteps] = useState([]);
  const { language } = useLanguage(); // 获取当前语言

  // 从 public 文件夹中加载 单独text 文件
  useEffect(() => {
    const url = `/data/text/${language}/ending-nebula-text.md`;
    fetch(url)    
      .then((res) => res.text())
      .then((text) => {
        const blocks = text
          .split(/<!--\s*step\d+\s*-->/gm)
          .filter((block) => block.trim().length > 0)
          .map((block) => block.trim());
        setTextSteps(blocks);
      })
      .catch((err) => console.error("加载 单独text 出错:", err));
  }, []);

  useEffect(() => {
    function onScroll() {
      const rect = sectionRef.current.getBoundingClientRect();

      const vh = window.innerHeight;

      // ⭐ 核心：计算 progress
      let progress = 0;

      if (rect.top <= 0 && rect.bottom >= vh) {
        progress = Math.abs(rect.top) / (rect.height - vh);
      } else if (rect.top > 0) {
        progress = 0;
      } else {
        progress = 1;
      }

      // ⭐ 传给系统
      nebulaRef.current?.setProgress(progress);
    }

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={sectionRef} className="nebula">
      <div className="text-nebula">
        <ReactMarkdown>{textSteps[0]}</ReactMarkdown>
      </div>

      <div className="nebula-stickyContainer">
        <Nebula ref={nebulaRef} />
      </div>
    </div>
  );
}