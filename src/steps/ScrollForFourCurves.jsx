import { useEffect, useRef, useState } from "react";
import scrollama from "scrollama";
import FourCurvesBase from "../sections/top50Songs/fourCurvesBase";
import "../styles/fourCurves.css";
import ReactMarkdown from "react-markdown";

export default function ScrollForFourCurves() {
  const baseRef = useRef(null);
  const [featureSteps, setFeatureSteps] = useState([]);
  const scrollerRef = useRef(null);
  
  useEffect(() => {
    // 从 public 文件夹中加载 Markdown 文件
    fetch("/data/top50songs-feature-fourcurves-text.md")
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
        step: ".scrollingTextEndStep-4curves, .triggerStep-4curves", 
        offset: 0.5,
        debug: false
      })
      .onStepEnter(({ element, index, direction }) => {
        if (element.classList.contains("scrollingTextEndStep-4curves") && direction === "down") {
          switch (index) {
            case 0:
              baseRef.current.zoomToDissonanceKDE();
              break;
            case 1:
              baseRef.current.projectSongsToDissonance();
              break;
            case 2:
              baseRef.current.resetKDEZoom();
              baseRef.current.zoomTobpmKDE();
              break;
            case 3:
              baseRef.current.projectSongsToBPM();
              break;
            case 4:
              baseRef.current.resetKDEZoom();
              baseRef.current.zoomToDanceabilityKDE();
              break;
            case 5:
              baseRef.current.projectSongsToDanceability();
              break;
            case 6:
              baseRef.current.resetKDEZoom();
              baseRef.current.zoomToDynamicComplexityKDE();
              break;
            case 7:
              baseRef.current.projectSongsToDynamicComplexity();
              break;
              default:
              break;
          }
        }
        // if (element.classList.contains("triggerStep-4curves") && direction === "down") {
        //   switch (index) {
        //     case 1:
        //       baseRef.current.projectSongsToDissonance();
        //       break;
        //     default:
        //       break;
        //   }
        // }
      })
      .onStepExit(({ element, index, direction }) => {
        if (element.classList.contains("scrollingTextEndStep-4curves") && direction === "up") {
          switch (index) {
            case 0:
              baseRef.current.resetKDEZoom();
              break;
            case 1:
              baseRef.current.resetSongDivs();
              break;
            case 2:
              baseRef.current.backToDissonance();
              break;
            case 3:
              baseRef.current.resetSongDivs();
              break;
            case 4:
              baseRef.current.backToBPM();
              break;
            case 5:
              baseRef.current.resetSongDivs();
              break;
            case 6:
              baseRef.current.backToDanceability();
              break;
            case 7:
              baseRef.current.resetSongDivs();
              break;
            default:
              break;
          }
        }
        // if (element.classList.contains("triggerStep-4curves") && direction === "up") {
        //   switch (index) {
        //     case 1:
        //       baseRef.current.hideImages();
        //       baseRef.current.triggerClustering();
        //       break;
        //     default:
        //       break;
        //   }
        // }
      });

    const handleResize = () => scrollerRef.current?.resize();
    return () => {
      // 必须清理！！
      if (scrollerRef.current) {
        scrollerRef.current.destroy();
        scrollerRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
    }; 
  }, [baseRef.current, featureSteps]);

  return (
    <div className="four-curves full-screen">
      <div className="four-curves-stickyContainer">
        <FourCurvesBase ref={baseRef} />
      </div>

      <div className="scrollingTextContainer-4curves">
        <div className="scrolling-text-4curves">
          <ReactMarkdown>{featureSteps[0]}</ReactMarkdown>
        </div>
        <div className="scrolling-text-4curves">
          <ReactMarkdown>{featureSteps[1]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-4curves"></div>
      </div>

      <div className="scrollingTextContainer-4curves">
        <div className="scrolling-text-4curves">
          <ReactMarkdown>{featureSteps[2]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-4curves"></div>
      </div>
    
      <div className="scrollingTextContainer-4curves">
        <div className="scrolling-text-4curves">
          <ReactMarkdown>{featureSteps[3]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-4curves"></div>
      </div>

      <div className="scrollingTextContainer-4curves">
        <div className="scrolling-text-4curves">
          <ReactMarkdown>{featureSteps[4]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-4curves"></div>
      </div>

      <div className="scrollingTextContainer-4curves">
        <div className="scrolling-text-4curves">
          <ReactMarkdown>{featureSteps[5]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-4curves"></div>
      </div>

      <div className="scrollingTextContainer-4curves">
        <div className="scrolling-text-4curves">
          <ReactMarkdown>{featureSteps[6]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-4curves"></div>
      </div>

      <div className="scrollingTextContainer-4curves">
        <div className="scrolling-text-4curves">
          <ReactMarkdown>{featureSteps[7]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-4curves"></div>
      </div>

      <div className="scrollingTextContainer-4curves">
        <div className="scrolling-text-4curves">
          <ReactMarkdown>{featureSteps[8]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-4curves"></div>
      </div>

      {/* <div className="triggerStep-4curves"></div> */}

      <div style={{ height: '100vh', pointerEvents: 'auto' }} />
    </div>
  );
}
