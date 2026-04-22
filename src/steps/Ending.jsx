// steps/ScrollForEnding.jsx
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import "../styles/ending.css";
import { useLanguage } from "../components/LanguageContext";

export default function Ending() {
  const [content, setContent] = useState("");
  const { language } = useLanguage(); // 获取当前语言

  useEffect(() => {
    // 加载结尾 Markdown 文件
    const url = `/data/text/${language}/ending-text.md`;
    fetch(url)
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((err) => console.error("加载 Ending 内容出错:", err));
  }, []);

  return (
    <div className="ending-section">
      <div className="ending-container">
        <div className="ending-content">
          <ReactMarkdown
            components={{
              // 让链接在新标签页打开
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}