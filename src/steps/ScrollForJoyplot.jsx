import { useEffect, useRef, useState } from "react";
import scrollama from "scrollama";
import JoyplotBase from "../sections/top50Songs/joyplotBase";
import "../styles/joyplot.css";
import ReactMarkdown from "react-markdown";

export default function ScrollForJoyplot() {
  const baseRef = useRef(null);
  const [featureSteps, setFeatureSteps] = useState([]);
  const scrollerRef = useRef(null);
  const illustrationScrollerRef = useRef(null);
  const [illustrationSteps, setIllustrationSteps] = useState([]);
  const [currentAnalysisMode, setCurrentAnalysisMode] = useState("amp60");
  const [isExplorationActive, setIsExplorationActive] = useState(false);
  // const [isToggleEnabled, setIsToggleEnabled] = useState(false);

  // 每个step都有必须满足的前置条件，若是滚动太快，前序被跳过，后续的step就可能不会正常触发
  // 同一个 step index，只允许执行一次完整状态切换
  const lastAppliedStepRef = useRef(null);

  // 新增滚动函数
  const scrollToFirstIllustrationTrigger = (mode) => {
    setTimeout(() => {
      const selector = `.triggerStep-illustration.${mode}`;
      const firstTrigger = document.querySelector(selector);

      if (firstTrigger) {
        console.log(`滚动到 ${mode} 的第一个 trigger`);

        firstTrigger.scrollIntoView({
          behavior: 'smooth',
          block: 'end',     // 或 'start' 如果想贴近顶部
          inline: 'nearest'
        });

        setTimeout(() => {
          scrollerRef.current?.resize();
          illustrationScrollerRef.current?.resize();
          console.log('Scrollama 已 resize');
        }, 700);  // 等待滚动动画完成
      } else {
        console.warn(`未找到 ${mode} trigger`);
      }
    }, 150);  // 等待 DOM 渲染
  };

  // 注册回调
  useEffect(() => {
    if (!baseRef.current) return;
    // 告诉子组件，callback函数设置为 setCurrentAnalysisMode
    baseRef.current.onAnalysisModeChange?.(setCurrentAnalysisMode);

    // 新增：注册 onModeSwitch 回调
    baseRef.current.onModeSwitch?.((newMode) => {
      console.log("父组件收到模式切换通知：", newMode);
      setCurrentAnalysisMode(newMode);
      scrollToFirstIllustrationTrigger(newMode);
    });
  }, []);
  
  useEffect(() => {
    // 从 public 文件夹中加载 Markdown 文件
    fetch("/data/top50songs-feature-joyplot-text.md")
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

  // 获取illustrationSteps的值
  useEffect(() => {
    if (!isExplorationActive) return;
    if (!baseRef.current) return;

    const blocks = baseRef.current.getIllustrationBlocks();
    if (!blocks || !blocks.length) return;

    // 用 blocks.length 来创建 trigger DOM 数量
    setIllustrationSteps(blocks.map((_, i) => i));
  }, [currentAnalysisMode, isExplorationActive]); // ⚠️ 注意加上 analysisMode 或其他依赖

  // ⚡ 初始化/销毁 illustration scrollama
  function initIllustrationScroll(analysisMode) {
    destroyIllustrationScroll(); // 先清理上一个

    const steps = document.querySelectorAll(
      `.triggerStep-illustration.${analysisMode}`
    );

    console.log("illustration steps:", steps.length);

    illustrationScrollerRef.current = scrollama();
    illustrationScrollerRef.current
      .setup({
        step: `.triggerStep-illustration.${analysisMode}`,
        offset: 0.6,
        debug: false
      })
      .onStepEnter(({ element, direction }) => {
        if (direction !== "down") return;
        const step = Number(element.dataset.illustrationStep);
        baseRef.current.showIllustration(step);
      })
      .onStepExit(({ element, direction }) => {
        if (direction !== "up") return;
        const step = Number(element.dataset.illustrationStep);
        if (step === 0) baseRef.current.hideIllustration();
        else baseRef.current.showIllustration(step - 1);
      });
  }

  function destroyIllustrationScroll() {
    if (illustrationScrollerRef.current) {
      illustrationScrollerRef.current.destroy();
      illustrationScrollerRef.current = null;
    }
  }

  // // ⚡ 切换支线时
  // useEffect(() => {
  //   if (!illustrationSteps.length) return;
  //   initIllustrationScroll(currentAnalysisMode);
  //   return destroyIllustrationScroll;
  // }, [illustrationSteps, currentAnalysisMode, isExplorationActive]);
  useEffect(() => {
    if (!illustrationSteps.length) return;

    const id = requestAnimationFrame(() => {
      initIllustrationScroll(currentAnalysisMode);
    });

    return () => {
      cancelAnimationFrame(id);
      destroyIllustrationScroll();
    };
  }, [illustrationSteps, currentAnalysisMode]);

  useEffect(() => {
    if (!baseRef.current || featureSteps.length === 0) return;
    scrollerRef.current = scrollama();

    scrollerRef.current
      .setup({
        step: ".scrollingTextEndStep-joyplot, .triggerStep-joyplot", 
        offset: 0.5,
        debug: false
      })
      .onStepEnter(({ element, index, direction }) => {
        if (element.classList.contains("scrollingTextEndStep-joyplot") && direction === "down") {
          // ⭐ 关键：防止重复 / 跳跃执行
          if (lastAppliedStepRef.current === index) return;
          lastAppliedStepRef.current = index;

          switch (index) {
            case 0:
              baseRef.current.pauseWaveformInteraction();
              baseRef.current.addZoomFrame();
              break;
            case 1:
              baseRef.current.zoomToFirstMinute();
              baseRef.current.pauseWaveformClick();
              baseRef.current.resetWaveformInteraction();
              break;
            case 2:
              baseRef.current.changeTo60sAmplitude();
              break;
            case 3:
              baseRef.current.moveWaveformsToExploratoryChart();
              baseRef.current.showControls();
              baseRef.current.createAndShowOverview();
              setIsExplorationActive(true);
              setCurrentAnalysisMode("amp60");
              baseRef.current.resetToDefaultAnalysisMode();
              
              // 关键修复：每次向下进入 case 3，都重新初始化 illustration scroller
              destroyIllustrationScroll();           // 先清理（防止残留旧实例）
              initIllustrationScroll(currentAnalysisMode);  // 立即重建

              console.log(
                document.querySelectorAll(`.triggerStep-illustration.${currentAnalysisMode}`).length
              );
              break;
            case 4:
              baseRef.current.showToggle();
              break;
            case 5:
              baseRef.current.hideToggle();
              break;              
              default:
              break;
          }
        }
        // if (element.classList.contains("triggerStep-joyplot") && direction === "down") {
        //   const step = Number(element.dataset.illustrationStep);
        //   baseRef.current.showIllustration(step);
        // }
      })
      .onStepExit(({ element, index, direction }) => {
        if (element.classList.contains("scrollingTextEndStep-joyplot") && direction === "up") {
          // ⭐ 同样的保护
          if (lastAppliedStepRef.current === index) {
            lastAppliedStepRef.current = index - 1;
          }
          
          switch (index) {
            case 0:
              baseRef.current.hideZoomFrame();
              baseRef.current.resetWaveformInteraction();
              break;
            case 1:
              baseRef.current.backToInitialDomain();
              baseRef.current.resetWaveformClick();
              baseRef.current.pauseWaveformInteraction();
              break;
            case 2:
              baseRef.current.changeToFullAmplitude();
              break;
            case 3:
              destroyIllustrationScroll();   // ⭐ 销毁第二时间轴
              // setIsToggleEnabled(false);   // ⭐ reset
              baseRef.current.hideControls();
              baseRef.current.backToWaveforms();
              break;
            case 4:
              baseRef.current.hideToggle();
              break;
            case 5:
              baseRef.current.showToggle();
              break;
            default:
              break;
          }
        }
        // if (element.classList.contains("triggerStep-joyplot") && direction === "up") {
        //   const step = Number(element.dataset.illustrationStep);
        //   if (step === 0) {
        //     baseRef.current.hideIllustration();
        //   } else {
        //     baseRef.current.showIllustration(step - 1);
        //   }
        // }
      });

    // const handleResize = () => scrollerRef.current?.resize();
    const handleResize = () => {
      scrollerRef.current?.resize();
      illustrationScrollerRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      // 必须清理！！
      if (scrollerRef.current) {
        scrollerRef.current.destroy();
        scrollerRef.current = null;
      }
      destroyIllustrationScroll();
      window.removeEventListener("resize", handleResize);
    }; 
  }, [baseRef.current, featureSteps]);

  return (
    <div className="joyplot full-screen">
      <div className="joyplot-stickyContainer">
        <JoyplotBase ref={baseRef} />
      </div>

      <div className="scrollingTextContainer-joyplot">
        <div className="scrolling-text-joyplot">
          <ReactMarkdown>{featureSteps[0]}</ReactMarkdown>
        </div>
        <div className="scrolling-text-joyplot">
          <ReactMarkdown>{featureSteps[1]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-joyplot"></div>
      </div>

      <div className="scrollingTextContainer-joyplot">
        <div className="scrolling-text-joyplot">
          <ReactMarkdown>{featureSteps[2]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-joyplot"></div>
      </div>

      <div className="scrollingTextContainer-joyplot">
        <div className="scrolling-text-joyplot">
          <ReactMarkdown>{featureSteps[3]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-joyplot"></div>
      </div>

      <div className="scrollingTextContainer-joyplot">
        <div className="scrolling-text-joyplot">
          <ReactMarkdown>{featureSteps[4]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-joyplot"></div>
      </div>

      {/* <div className="triggerStep-joyplot"></div> */}
      {/* ⚡ trigger DOM 只挂载当前支线 */}
      {/* {(illustrationSteps || []).map((_, i) => (
        <div
          key={i}
          className={`triggerStep-illustration ${currentAnalysisMode}`}
          data-illustration-step={i}
        />
      ))} */}
      {currentAnalysisMode === 'amp60' && illustrationSteps?.length > 0 && (
        <div className="triggers-amp60">
          {illustrationSteps.map((_, i) => (
            <div
              key={`amp60-${i}`}           // 或 `a-${i}`
              className="triggerStep-illustration amp60"
              data-illustration-step={i}
            />
          ))}
        </div>
      )}

      <div className="scrollingTextContainer-joyplot">
        <div className="scrolling-text-joyplot">
          <ReactMarkdown>{featureSteps[5]}</ReactMarkdown>
        </div>
        <div className="scrolling-text-joyplot">
          <ReactMarkdown>{featureSteps[6]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-joyplot"></div>
      </div>

      {/* ⚡ trigger DOM 只挂载当前支线 */}
      {/* {isToggleEnabled &&
        (illustrationSteps || []).map((_, i) => (
          <div
            key={i}
            className={`triggerStep-illustration ${currentAnalysisMode}`}
            data-illustration-step={i}
          />
      ))} */}
      {currentAnalysisMode === 'spec60' && illustrationSteps?.length > 0 && (
        <div className="triggers-spec60">
          {illustrationSteps.map((_, i) => (
            <div
              key={`ampFull-${i}`}         // 或 `b-${i}`
              className="triggerStep-illustration spec60"
              data-illustration-step={i}
            />
          ))}
        </div>
      )}

      <div className="scrollingTextContainer-joyplot">
        <div className="scrolling-text-joyplot">
          <ReactMarkdown>{featureSteps[7]}</ReactMarkdown>
        </div>
        <div className="scrollingTextEndStep-joyplot"></div>
      </div>

      <div style={{ height: '100vh', pointerEvents: 'auto' }} />
    </div>
  );
}
