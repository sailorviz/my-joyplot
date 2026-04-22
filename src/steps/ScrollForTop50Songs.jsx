import { useEffect, useRef, useState } from "react";
import scrollama from "scrollama";
import BaseSquares from "../sections/top50Songs/BaseSquares";
import "../styles/top50Songs.css";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "../components/LanguageContext";

export default function ScrollForTop50Songs() {
  const baseRef = useRef(null);
  const [infoSteps, setInfoSteps] = useState([]);
  const scrollerRef = useRef(null);
  const { language } = useLanguage(); // 获取当前语言
  
  useEffect(() => {
    // 从 public 文件夹中加载 Markdown 文件
    const url = `/data/text/${language}/top50songs-info-texts.md`;
    fetch(url)    
      .then((res) => res.text())
      .then((text) => {
        const blocks = text
          .split(/<!--\s*step\d+\s*-->/gm)
          .filter((block) => block.trim().length > 0)
          .map((block) => block.trim());
        setInfoSteps(blocks);
      })
      .catch((err) => console.error("加载 Markdown 出错:", err));
  }, []);

  useEffect(() => {
    if (!baseRef.current || infoSteps.length === 0) return;
    scrollerRef.current = scrollama();

    scrollerRef.current
      .setup({
        step: ".scrollingTextEndStep-top50songs, .triggerStep-top50songs", 
        offset: 0.5,
        debug: false
      })
      .onStepEnter(({ element, index, direction }) => {
        if (element.classList.contains("scrollingTextEndStep-top50songs") && direction === "down") {
          switch (index) {
            case 0:
              baseRef.current.pause();
              baseRef.current.triggerPlottingTimelineForSongs();
              break;
            case 1:
              baseRef.current.triggerDrawReleaseYearDensity();
              break;
            case 2:
              baseRef.current.backToTimelineWithSquares();
              baseRef.current.triggerCompareWithArtist();
              break;
            case 3:
              baseRef.current.triggerCompareWithAlbum();
              break;
            case 4:
              baseRef.current.addPopularitiesForSongs();
              break;
            case 5:
              baseRef.current.triggerDrawPopularityDensity();
              break;
            case 7:
              baseRef.current.backToBaseSquaresAgain();
              break;
            case 8:
              baseRef.current.genreCompare();
              break;
            case 9:
              baseRef.current.drawGenreTreemap();
              break;
            case 10:
              baseRef.current.moodCompare();
              break;
            case 11:
              baseRef.current.moodCategoryCompare();
              break;
            case 12:
              baseRef.current.drawMoodTreemap();
              break;
            case 13:
              baseRef.current.drawSankeyChart();
              break;
              default:
              break;
          }
        }
        if (element.classList.contains("triggerStep-top50songs") && direction === "down") {
          switch (index) {
            case 6:
              baseRef.current.triggerDrawPopularityDensityOfAllSongs();
              break;        
            default:
              break;
          }
        }
      })
      .onStepExit(({ element, index, direction }) => {
        if (element.classList.contains("scrollingTextEndStep-top50songs") && direction === "up") {
          switch (index) {
            case 0:
              baseRef.current.backToBaseSquares();
              break;
            case 1:
              baseRef.current.backToTimelineWithSquares();
              break;
            case 2:
              baseRef.current.backToTimelineWithKDE();
              break;
            case 3:
              baseRef.current.triggerCompareWithArtist();
              break;
            case 4:
              baseRef.current.backToCompareWithAlbum();
              break;
            case 5:
              baseRef.current.backToPopularitiesForSongs();
              break;
            case 7:
              baseRef.current.backTo2KDE();
              break;
            case 8:
              baseRef.current.genreCompareToBaseSquares();
              break;
            case 9:
              baseRef.current.genreTreemapToGenreCompare();
              break;
            case 10:
              baseRef.current.moodCompareToGenreTreemap();
              break;
            case 11:
              baseRef.current.moodCategoryCompareToMoodCompare();
              break;
            case 12:
              baseRef.current.moodTreemapToMoodCategoryCompare();
              break;
            case 13:
              baseRef.current.sankeyChartToMoodTreemap();
              break;
            default:
              break;
          }
        }
        if (element.classList.contains("triggerStep-top50songs") && direction === "up") {
          switch (index) {
            case 6:
              baseRef.current.backToOneKDE();
              break;
            default:
              break;
          }
        }
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
  }, [baseRef.current, infoSteps]);

  return (
    <div className="top50Songs full-screen">
      <div className="topsongs-stickyContainer">
        <BaseSquares ref={baseRef} />
      </div>

      <div className="scrollingTextContainer-top50songs">
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[0]}</ReactMarkdown>
        </div>
      </div>

      <div className="scrollingTextContainer-top50songs">
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[1]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-top50songs"></div>
      </div>

      <div className="scrollingTextContainer-top50songs">
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[2]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-top50songs"></div>
      </div>

      <div className="scrollingTextContainer-top50songs">
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[3]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-top50songs"></div>
      </div>

      <div className="scrollingTextContainer-top50songs">
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[4]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-top50songs"></div>
      </div>

      <div className="scrollingTextContainer-top50songs">
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[5]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-top50songs"></div>
      </div>

      <div className="scrollingTextContainer-top50songs">
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[6]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-top50songs"></div>
      </div>

      <div className="triggerStep-top50songs"></div>      

      <div className="scrollingTextContainer-top50songs">
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[7]}</ReactMarkdown>
        </div>
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[8]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-top50songs"></div>
      </div>

      <div className="scrollingTextContainer-top50songs">
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[9]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-top50songs"></div>
      </div>

      <div className="scrollingTextContainer-top50songs">
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[10]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-top50songs"></div>
      </div>

      <div className="scrollingTextContainer-top50songs">
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[11]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-top50songs"></div>
      </div>

      <div className="scrollingTextContainer-top50songs">
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[12]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-top50songs"></div>
      </div>

      <div className="scrollingTextContainer-top50songs">
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[13]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-top50songs"></div>
      </div>

      <div className="scrollingTextContainer-top50songs">
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[14]}</ReactMarkdown>
        </div>
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[15]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-top50songs"></div>
      </div>

      <div className="scrollingTextContainer-top50songs">
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[16]}</ReactMarkdown>
        </div>
        <div className="scrolling-text-top50songs">
          <ReactMarkdown>{infoSteps[17]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-top50songs"></div>
      </div>

      {/* <div className="triggerStep-top50songs"></div> */}
    </div>
  );
}
