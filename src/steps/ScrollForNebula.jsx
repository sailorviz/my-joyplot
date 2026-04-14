import { useEffect, useRef, useState } from "react";
import Nebula from "../sections/nebula/Nebula";
import "../styles/nebula.css";
import ReactMarkdown from "react-markdown";


export default function ScrollForNebula() {
  const nebulaRef = useRef(null);
  const sectionRef = useRef(null);
  const [textSteps, setTextSteps] = useState([]);

  // 从 public 文件夹中加载 单独text 文件
  useEffect(() => {    
    fetch("/data/ending-nebula-text.md")
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
      <div className="nebula-stickyContainer">
        <Nebula ref={nebulaRef} />
      </div>
    </div>
  );
}