import { useEffect, useRef, useState } from "react";
import scrollama from "scrollama";
import FloatingSongs from "../sections/FlowingSongs/FloatingSongs";
import "../styles/FloatingSongs.css";
import ReactMarkdown from "react-markdown";

export default function ScrollForFlowingSongs() {
  const floatingRef = useRef(null);
  const [artistSteps, setArtistSteps] = useState([]);
  const [albumSteps, setAlbumSteps] = useState([]);
  const scrollerRef = useRef(null);
  
  useEffect(() => {
    // 从 public 文件夹中加载 Markdown 文件
    fetch("/data/top30artists-texts.md")
      .then((res) => res.text())
      .then((text) => {
        // 按标题（# step）分段
        const blocks = text
          .split(/^#\s+(?=step\d+)/gm)
          .filter((t) => t.trim().length > 0)
          .map((t) => `# ${t.trim()}`); // 补回 #
        setArtistSteps(blocks);
      })
      .catch((err) => console.error("加载 Markdown 出错:", err));
  }, []);
  console.log("artistSteps :" + artistSteps);

  useEffect(() => {
    // 从 public 文件夹中加载 Markdown 文件
    fetch("/data/top30albums-texts.md")
      .then((res) => res.text())
      .then((text) => {
        // 按标题（# step）分段
        const blocks = text
          .split(/^#\s+(?=step\d+)/gm)
          .filter((t) => t.trim().length > 0)
          .map((t) => `# ${t.trim()}`); // 补回 #
        setAlbumSteps(blocks);
      })
      .catch((err) => console.error("加载 Markdown 出错:", err));
  }, []);
  console.log("albumSteps :" + albumSteps);

  useEffect(() => {
    scrollerRef.current = scrollama();

    scrollerRef.current
      .setup({
        step: ".scrollingTextEndStep, .triggerStep", // 文字底部 + 后续触发点
        offset: 0.5,
        debug: false
      })
      .onStepEnter(({ element, index, direction }) => {
        if (element.classList.contains("scrollingTextEndStep") && direction === "down") {
          switch (index) {
            case 0:
              floatingRef.current.pause();
              floatingRef.current.triggerClustering();
              break;
            case 2:
              floatingRef.current.focusTop1Artist();
              break;
            case 4:
              floatingRef.current.triggerPlottingTimeline();
              break;
            case 5:
              floatingRef.current.triggerClusterTimezone();
              break;   
            case 6:
              floatingRef.current.dropClusterToMap();
              break; 
            case 7:
              floatingRef.current.resetFloating();
              break; 
            case 8:
              floatingRef.current.pause();
              floatingRef.current.triggerClusteringByAlbum();
              break;    
            case 11:
              floatingRef.current.cancelFocusClusterOfAlbum();
              break;    
            case 13:
              floatingRef.current.highlightAlbumFromBand();
              break; 
            case 14:
              floatingRef.current.triggerPlottingTimelineForAlbums();
              break;
            case 15:
              floatingRef.current.triggerClusterTimezoneOfAlbum();
              break;
            case 16:
              floatingRef.current.clustersJumpingOut();
              break; 
            case 17:
              floatingRef.current.continueToJumpOutB();
              break;               
            case 18:
              floatingRef.current.backToInitialJumping();
              break;
            case 20:
              floatingRef.current.backToInitialJumpingF();
              break;
              default:
              break;
          }
        }
        if (element.classList.contains("triggerStep") && direction === "down") {
          switch (index) {
            case 1:
              floatingRef.current.animateClusterWithImages();
              break;
            case 3:
              floatingRef.current.cancelFocusCluster();
              floatingRef.current.highlightBands();
              break; 
            case 9:
              floatingRef.current.animateClusterOfAlbumWithImage();
              break; 
            case 10:
              floatingRef.current.focusTop1Album();
              break; 
            case 12:
              floatingRef.current.animateClusterCompare();
              break; 
            case 19:
              floatingRef.current.continueToJumpOutFamily();
              break;
            default:
              break;
          }
        }
      })
      .onStepExit(({ element, index, direction }) => {
        if (element.classList.contains("scrollingTextEndStep") && direction === "up") {
          switch (index) {
            case 0:
              floatingRef.current.resetFloating();
              break;
            case 2:
              floatingRef.current.cancelFocusCluster();
              break;
            case 4:
              floatingRef.current.timelineToLastStep();
              break;  
            case 6:
              floatingRef.current.backToTimeline();
              break; 
            case 7:
              floatingRef.current.pause();
              floatingRef.current.backToMap();
              break;
            case 8:
              floatingRef.current.resetFloating();
              break;
            case 11:
              floatingRef.current.focusTop1Album();
              break;   
            case 13:
              floatingRef.current.cancelHighlightBands();
              break; 
            case 14:
              floatingRef.current.timelineOfAlbumToLastStep();
              break; 
            case 16:
              floatingRef.current.backToAlbumTimeline();
              break;
            case 17:
              floatingRef.current.backToInitialJumping();
              break; 
            case 18:
              floatingRef.current.continueToJumpOutB();
              break; 
            case 20:
              floatingRef.current.continueToJumpOutFamily();
              break;                               
            default:
              break;
          }
        }
        if (element.classList.contains("triggerStep") && direction === "up") {
          switch (index) {
            case 1:
              floatingRef.current.hideImages();
              floatingRef.current.triggerClustering();
              break;
            case 3:
              floatingRef.current.cancelHighlightBands();
              floatingRef.current.focusTop1Artist();
              break;
            case 9:
              floatingRef.current.hideCovers();
              floatingRef.current.triggerClusteringByAlbum();
              break;
            case 10:
              floatingRef.current.cancelFocusClusterOfAlbum();
              break; 
            case 12:
              floatingRef.current.cancelComparing();
              break; 
            case 19:
              floatingRef.current.backToInitialJumpingF();
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
  }, []);

  return (
    <div className="floatingSongs full-screen">
      <div className="stickyContainer">
        <FloatingSongs ref={floatingRef} />
      </div>

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{artistSteps[0]}</ReactMarkdown>
        </div>
        <div className="scrolling-text">
          <ReactMarkdown>{artistSteps[1]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep"></div>
      </div>

      <div className="triggerStep"></div>

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{artistSteps[2]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep"></div>
      </div>

      <div className="triggerStep"></div>

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{artistSteps[3]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep"></div>
      </div> 

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{artistSteps[4]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep"></div>
      </div> 

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{artistSteps[5]}</ReactMarkdown>
        </div>
        <div className="scrolling-text">
          <ReactMarkdown>{artistSteps[6]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep"></div>
      </div>  

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{artistSteps[7]}</ReactMarkdown>
        </div>
        <div className="scrolling-text">
          <ReactMarkdown>{artistSteps[8]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep"></div>
      </div>  

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{albumSteps[0]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep"></div>
      </div>

      <div className="triggerStep"></div>  
      <div className="triggerStep"></div>  

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{albumSteps[1]}</ReactMarkdown>
        </div>
        <div className="scrolling-text">
          <ReactMarkdown>{albumSteps[2]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep"></div>
      </div>

      <div className="triggerStep"></div> 

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{albumSteps[3]}</ReactMarkdown>
        </div>
      </div>

      <div style={{ height: '100vh', pointerEvents: 'auto' }} />

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{albumSteps[4]}</ReactMarkdown>
        </div>
        <div className="scrolling-text">
          <ReactMarkdown>{albumSteps[5]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep"></div>
      </div>

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{albumSteps[6]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep"></div>
      </div>

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{albumSteps[7]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep"></div>
      </div>

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{albumSteps[8]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep"></div>
      </div>

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{albumSteps[9]}</ReactMarkdown>
        </div>
      </div>
      
      <div style={{ height: '80vh', pointerEvents: 'auto' }} />
      
      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{albumSteps[10]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep"></div>
      </div>  

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{albumSteps[11]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep"></div>
      </div>  

      <div className="triggerStep"></div>  

      <div className="scrollingTextContainer">
        <div className="scrolling-text">
          <ReactMarkdown>{albumSteps[12]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep"></div>
      </div>      
    </div>
  );
}
