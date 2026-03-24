import { useEffect, useState, useRef, forwardRef, useImperativeHandle, useMemo } from "react";
import { createPortal } from "react-dom";
import * as d3 from "d3";
import Papa from "papaparse";
import { marked } from "marked";
import "../../styles/joyplot.css";
import { createJoyplot } from "./audioFeature/joyplots/createJoyplot";
import { extractSongTitleFromFilename } from "../../components/extractSongTitleFromFilename";
import { addZoomFrame } from "./audioFeature/joyplots/addZoomFrame";
import { setWaveformStates } from "./audioFeature/joyplots/setWaveformStates";
import { zoomToFirstMinute } from "./audioFeature/joyplots/zoomToFirstMinute";
import JoyplotControls from "./audioFeature/joyplots/JoyplotControls";
import { createOverview } from "./audioFeature/joyplots/createOverview";

const JoyplotBase = forwardRef((_, ref) => {
  const [songInfo, setSongInfo] = useState([]);
  const containerRef = useRef(null);
  const filePathOfCompletedWaveforms = "/data/amplitude_envelope_completed_0.5s.json";
  const [completedWaveforms, setCompletedWaveforms] = useState([]);
  const [waveforms60s, setWaveforms60s] = useState([]);
  const [spectralCentroid60s, setSpectralCentroid60s] = useState([]);
  const [mergedSongs, setMergedSongs] = useState([]);
  const [clipInfo, setClipInfo] = useState([]);
  const [showControls, setShowControls] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const [isExploratory, setIsExploratory] = useState(false); // 控制toggle的显示与否
  const xScaleRef = useRef(null);
  const domainRef = useRef(null);
  const initialJoyplotRef = useRef(null);
  const waveformStatesRef = useRef(null);
  const zoomFrameStatesRef = useRef(null);
  const overviewRef = useRef(null);
  const allInteractionLockedRef = useRef(false);
  const clickLockedRef = useRef(false);
  const [exploratoryState, setExploratoryState] = useState({
    filter: { type: "", value: "" }, // 二级 filter
    sort: ""                         // 排序字段，如 "bpm" / "energy"
  });
  const controlsTargetRef = useRef(null);
  const toggleRef = useRef(null);
  const joyplotTitleRef = useRef(null);
  const amplitudeFactorRef = useRef(1);  // ✅ 追踪当前振幅
  const [tooltipStage, setTooltipStage] = useState("waveform"); // "waveform" | "exploratory"
  const illustrationBlocksRef = useRef([]);
  const illustrationAreaRef = useRef(null);
  const [analysisMode, setAnalysisMode] = useState("amp60"); // "amplitude" | "spectral"
  const illustrationSources = {
    amp60: "/data/ampIllustrationTexts.md",
    spec60: "/data/specIllustrationTexts.md"
  };
  const nextMode =
    analysisMode === "amp60" ? "spec60" : "amp60";
  const nextModeLabel =
    nextMode === "amp60" ? "Amplitude Envelope" : "Spectral Centroid";
  // 保存父组件传入的回调
  const callbackRef = useRef(null);
  const callbackToggleRef = useRef(null);


  // 加载 completedWaveforms 数据文件
  useEffect(() => {
    d3.json(filePathOfCompletedWaveforms).then(setCompletedWaveforms);
  }, []);

  // 加载 60sAmplitude 数据文件
  useEffect(() => {
    d3.json("/data/amplitude_envelope_60s_0.5s.json").then(setWaveforms60s);
  }, []);

  // 加载 60s spectral centroid 数据文件
  useEffect(() => {
    d3.json("/data/spectral_centroids_60s_0.5s.json").then(setSpectralCentroid60s);
  }, []);

  // 加载 illustration texts 数据文件
  useEffect(() => {
    fetch(illustrationSources[analysisMode])
      .then(res => res.text())
      .then(text => {
        const blocks = text
          .split(/^#\s+(?=step\d+)/gm)
          .filter(t => t.trim().length > 0)
          .map(t => `# ${t.trim()}`)

        // ⚠️ 存进 ref，不触发 rerender
        illustrationBlocksRef.current = blocks
      })
      .catch(err => {
        console.error("加载 Markdown 出错:", err)
      })
  }, [analysisMode]);

  // 为 completedWaveforms 每组data增加song_name字段
  const [processedWaveforms, setProcessedWaveforms] = useState([]);
  useEffect(() => {
    if (!completedWaveforms.length) return;
    const processed = completedWaveforms.map(w => ({
      ...w,
      song_name: extractSongTitleFromFilename(w.file_name)
    }));

    setProcessedWaveforms(processed);
  }, [completedWaveforms]);

  const [processedWaveforms60s, setProcessedWaveforms60s] = useState([]);
  useEffect(() => {
    if (!waveforms60s.length) return;

    const processed = waveforms60s.map(w => ({
      ...w,
      song_name: extractSongTitleFromFilename(w.file_name)
    }));

    setProcessedWaveforms60s(processed);
  }, [waveforms60s]);

  const [processedSpectralCentroid60s, setProcessedSpectralCentroid60s] = useState([]);
  useEffect(() => {
    if (!spectralCentroid60s.length) return;

    const processed = spectralCentroid60s.map(w => ({
      ...w,
      song_name: extractSongTitleFromFilename(w.file_name)
    }));

    setProcessedSpectralCentroid60s(processed);
  }, [spectralCentroid60s]);

  // 加载songs' infos 数据
  useEffect(() => {
    fetch("/data/top50_songs.csv")
      .then((res) => res.text())
      .then((csvText) => {
        const result = Papa.parse(csvText, { header: true });
        const data = result.data.map((row, index) => ({
          id: index,
          song: row.song?.trim() || "",
          artist: row.artist?.trim() || "",
          album: row.album?.trim() || "",
          genre: row.genre?.trim() || "",
          mood: row.mood?.trim() || "",
          dissonance: row.dissonance?.trim() || "",
          bpm: row.bpm?.trim() || "",
          danceability: row.danceability?.trim() || "",
          dynamic_complexity: row.dynamic_complexity?.trim() || "",
          duration: row.duration?.trim() || "",
          key: row.key?.trim() || "",
          scale: row.scale?.trim() || "",
          instrument: row.instrument?.trim() || "",         
        }));
        setSongInfo(data);
      })
      .catch((err) => console.error(err));
  }, []);

  // 加载clips' infos 数据
  useEffect(() => {
    fetch("/data/clip_songs.csv")
      .then((res) => res.text())
      .then((csvText) => {
        const result = Papa.parse(csvText, { header: true });
        const data = result.data.map((row, index) => ({
          id: index,
          song: row.song?.trim() || "",
          clip_duration: row.clip_duration?.trim() || "",
          clip_start: row.clip_start?.trim() || "",
        }));
        setClipInfo(data);
      })
      .catch((err) => console.error(err));
  }, []);

  // 生成mergedSongs
  useEffect(() => {
    if (
      !songInfo.length ||
      !processedWaveforms.length ||
      !processedWaveforms60s.length ||
      !clipInfo.length ||
      !processedSpectralCentroid60s.length
    ) return;

    // 创建 Map，key = song_name，value = waveform 对象
    const waveformMap = new Map(processedWaveforms.map(w => [w.song_name, w]));
    const waveformMap60s = new Map(
      processedWaveforms60s.map(w => [w.song_name, w])
    );
    const spectralCentroidMap60s = new Map(
      processedSpectralCentroid60s.map(w => [w.song_name, w])
    );

    // 创建 Map，key = song_name，value = clip 对象
    const clipMap = new Map(clipInfo.map(c => [c.song, c]));

    const merged = songInfo.map((song, index) => {
      const waveformData = waveformMap.get(song.song); // waveform
      const waveform60s = waveformMap60s.get(song.song);
      const spectralCentroids60s = spectralCentroidMap60s.get(song.song);
      const clipData = clipMap.get(song.song);         // clip info

      return {
        id: `song-${index}`,        // ⭐ 稳定 id
        song: song.song,
        artist: song.artist,
        album: song.album,
        genre: song.genre,
        mood: song.mood,
        dissonance: song.dissonance,
        bpm: song.bpm,
        danceability: song.danceability,
        dynamic_complexity: song.dynamic_complexity,
        duration: song.duration,
        key: song.key,
        scale: song.scale,
        instrument: song.instrument,
        waveform: waveformData?.waveform || [],
        amplitude_60s: waveform60s?.waveform || [],
        spectral_60s: spectralCentroids60s?.spectral_centroid || [],
        clip_start: clipData ? Number(clipData.clip_start) : 0,      // 转为数字
        clip_duration: clipData ? Number(clipData.clip_duration) : 0, // 转为数字
        // ⭐ 当前 waveform 使用的序列
        series: [],
      };
    });

    setMergedSongs(merged);
  }, [songInfo, processedWaveforms, processedWaveforms60s, processedSpectralCentroid60s, clipInfo]);

  // 生成 derivedSongs，保持一首歌一条 waveform
  const derivedSongs = useMemo(() => {
    let result = [...mergedSongs];

    // ---------- 二级 Filter ----------
    const { type, value } = exploratoryState.filter;
    if (type && value) {
      result = result.filter(d => {
        // 将 genre / mood 拆成数组，再判断包含
        if (type === "genre" || type === "mood") {
          const values = d[type]?.split(",").map(v => v.trim()) || [];
          return values.includes(value);
        }
        // 其他字段直接匹配
        return d[type] === value;
      });
    }

    // ---------- Sort ----------
    const sortField = exploratoryState.sort;
    if (sortField) {
      result.sort((a, b) => {
        const aVal = Number(a[sortField]) || 0;
        const bVal = Number(b[sortField]) || 0;
        return bVal - aVal; // 降序
      });
    }

    return result;
  }, [mergedSongs, exploratoryState]);

  useEffect(() => {
    if (!mergedSongs.length) return;
    if (initialJoyplotRef.current) return; // 👈 防止重复创建
    const container = containerRef.current;
    if (!container) return;

    // 清空 container（保留 React 管理的容器节点本身）
    container.replaceChildren();

    // 创建layout分区
    const leftPanel = document.createElement("div");
    leftPanel.className = "left-panel";
    container.appendChild(leftPanel);

    const rightPanel = document.createElement("div");
    rightPanel.className = "right-panel";
    container.appendChild(rightPanel);

    // 创建 title div
    const title = document.createElement("div");
    title.className = "joyplot-title";
    leftPanel.appendChild(title);

    joyplotTitleRef.current = title;

    // 创建 controls div
    const controls = document.createElement("div");
    controls.className = "controls-div";
    leftPanel.appendChild(controls);

    controlsTargetRef.current = controls;

    // 创建 joyplot div
    const joyplot = document.createElement("div");
    joyplot.className = "joyplot-div";
    leftPanel.appendChild(joyplot);

    // 创建 overview div
    const overview = document.createElement("div");
    overview.className = "overview-div";
    leftPanel.appendChild(overview);

    // 创建右侧 text及其他 说明区
    const illustrationArea = document.createElement("div");
    illustrationArea.className = "illustration-area";
    rightPanel.appendChild(illustrationArea);
    illustrationAreaRef.current = illustrationArea;

    // 创建右侧 toggle 区
    const toggle = document.createElement("div");
    toggle.className = "toggle";
    rightPanel.appendChild(toggle);
    toggleRef.current = toggle;

    // 创建tooltip元素
    const tooltip = document.createElement("div");
    tooltip.className = "joyplot-tooltip";
    container.appendChild(tooltip);

    // 绘制joyplot,用“全量初始数据”:mergedSongs
    const initialJoyplot = createJoyplot(containerRef.current, mergedSongs , tooltip, allInteractionLockedRef, clickLockedRef);
    // const initialJoyplot = createJoyplot(containerRef.current, derivedSongs , tooltip, allInteractionLockedRef, clickLockedRef);
    xScaleRef.current = initialJoyplot.xScale;
    domainRef.current = initialJoyplot.domain;
    initialJoyplotRef.current = initialJoyplot;
    waveformStatesRef.current = setWaveformStates(containerRef.current, allInteractionLockedRef, clickLockedRef);
  
  }, [mergedSongs]);

  useEffect(() => {
    if (!initialJoyplotRef.current) return;

    initialJoyplotRef.current.updateData(derivedSongs);
    overviewRef.current?.updateData(derivedSongs); // ⭐ 新增这一行

  }, [derivedSongs]);

  useEffect(() => {
    if (!initialJoyplotRef.current) return;

    initialJoyplotRef.current.updateEncoding(exploratoryState.filter);
  }, [exploratoryState.filter]);

  useEffect(() => {
    if (!initialJoyplotRef.current) return;

    initialJoyplotRef.current.updateSort(exploratoryState.sort);
  }, [exploratoryState.sort]);

  useEffect(() => {
    if (!initialJoyplotRef.current) return;

    initialJoyplotRef.current.updateTooltipStage(tooltipStage);
  }, [tooltipStage]);

  // 设置 toggle 切换内容
  useEffect(() => {
    if (!initialJoyplotRef.current) return;
    if (!joyplotTitleRef.current) return;
    // 只有在 exploratory 模式下才写 title
    if (!containerRef.current?.classList.contains("exploratory")) return;

    if (analysisMode === "amp60") {
      initialJoyplotRef.current?.setSeries("amp60");
      overviewRef.current?.render({ 
        seriesType : "amp60", 
        amplitudeFactor : amplitudeFactorRef.current
      }); 
      joyplotTitleRef.current.innerHTML =
        `<strong>Amplitude Envelope of songs</strong>`;
    }

    if (analysisMode === "spec60") {
      initialJoyplotRef.current?.setSeries("spec60");
      overviewRef.current?.render({ 
        seriesType : "spec60", 
        amplitudeFactor : amplitudeFactorRef.current - 1
      }); 
      joyplotTitleRef.current.innerHTML =
        `<strong>Spectral Centroid of songs</strong>`;
    }
  }, [analysisMode]);


   // 当 analysisMode 改变时，调用父组件回调函数
  useEffect(() => {
    if (callbackRef.current) {
      callbackRef.current(analysisMode);
    }
  }, [analysisMode]);

  // 暴露给外部的函数调用接口
  useImperativeHandle(ref, () => ({
    addZoomFrame: () => {
      const zoomFrameStates = addZoomFrame({
        container: containerRef.current,
        xScale: xScaleRef.current,
      });
      zoomFrameStatesRef.current = zoomFrameStates;
      zoomFrameStatesRef.current?.show();
    },
    pauseWaveformInteraction: () => waveformStatesRef.current?.pauseInteraction(),
    hideZoomFrame: () => zoomFrameStatesRef.current?.hide(),
    resetWaveformInteraction: () => waveformStatesRef.current?.resetInteraction(),
    pauseWaveformClick: () => waveformStatesRef.current?.pauseClick(),
    resetWaveformClick: () => waveformStatesRef.current?.resetClick(),
    zoomToFirstMinute: () => {
      const { newXScale, newDomain } = zoomToFirstMinute();
      initialJoyplotRef.current?.zoomWaveform({
        newDomain: newDomain,
      });
      initialJoyplotRef.current?.setAmplitude(2.5);
      amplitudeFactorRef.current = 2.5;
      zoomFrameStatesRef.current?.updateX(newXScale);
    },
    backToInitialDomain: () => {
      initialJoyplotRef.current?.zoomWaveform({
        newDomain: domainRef.current,
      });
      initialJoyplotRef.current?.setAmplitude(1);
      amplitudeFactorRef.current = 1;
      zoomFrameStatesRef.current?.updateX(xScaleRef.current);
    },
    changeTo60sAmplitude: () => {
      initialJoyplotRef.current?.setSeries("amp60"); // bug: 在更改数据源之后, 上一步的amplitudefactor启用
      initialJoyplotRef.current?.setAmplitude(amplitudeFactorRef.current, { animate: false });
    },
    changeToFullAmplitude: () => {
      initialJoyplotRef.current?.setSeries("full");
      initialJoyplotRef.current?.setAmplitude(amplitudeFactorRef.current, { animate: false });
    },
    showControls: () => setShowControls(true),
    hideControls: () => setShowControls(false),
    createAndShowOverview: () => {
      const overview = createOverview(containerRef.current, derivedSongs);
      overviewRef.current = overview;
      const xScaleFn = initialJoyplotRef.current?.getXScale();
      const xDomain = xScaleFn.domain();
      overviewRef.current?.render({ 
        xDomain : xDomain, 
        seriesType : "amp60", 
        amplitudeFactor : amplitudeFactorRef.current
      }); 
      overviewRef.current?.show();
    },
    moveWaveformsToExploratoryChart: () => {
      containerRef.current?.classList.add("exploratory");
      initialJoyplotRef.current?.syncToContainer();

      const zoomXScale = initialJoyplotRef.current?.getXScale();
      zoomFrameStatesRef.current?.updateX(zoomXScale);
      const svgArea = initialJoyplotRef.current?.getSVGArea();
      zoomFrameStatesRef.current?.updateLayout(svgArea);
      setTooltipStage("exploratory");
      joyplotTitleRef.current.innerHTML =
        `<strong>Amplitude Envelope of songs</strong>`;
    },
    backToWaveforms: () => {
      // ✅ 新增：重置 exploratoryState 为初始值
      setExploratoryState({
        filter: { type: "", value: "" },
        sort: ""
      });

      // 先移除 exploratory class，让布局回到“初始”状态
      containerRef.current?.classList.remove("exploratory");

      // 把数据强制改为amp60
      initialJoyplotRef.current?.setSeries("amp60");

      // 然后强制更新数据 + 重新适配当前容器尺寸
      initialJoyplotRef.current?.updateData(mergedSongs);
      initialJoyplotRef.current?.syncToContainer();  // 强烈建议一起调用

      const zoomXScale = initialJoyplotRef.current?.getXScale();
      zoomFrameStatesRef.current?.updateX(zoomXScale);
      const svgArea = initialJoyplotRef.current?.getSVGArea();
      zoomFrameStatesRef.current?.updateLayout(svgArea);

      // remove overview-svg
      overviewRef.current?.remove();
      setTooltipStage("waveform");
    },
    getIllustrationBlocks: () => {
      return illustrationBlocksRef.current || [];
    },
    showIllustration(step) {
      const area = illustrationAreaRef.current;
      if (!area) return;

      const blocks = illustrationBlocksRef.current;
      console.log(blocks);
      const md = blocks?.[step];
      if (!md) return;

      const html = marked.parse(md);
      area.innerHTML = html;
      area.classList.add("visible");
    },
    hideIllustration() {
      const area = illustrationAreaRef.current;
      if (!area) return;
      area.classList.remove("visible");
    },
    showToggle: () => setShowToggle(true),
    hideToggle: () => setShowToggle(false),
    onAnalysisModeChange: (callback) => {
      callbackRef.current = callback;  // 保存父组件的回调函数
    },
    onModeSwitch: (callback) => {
      callbackToggleRef.current = callback; // 保存父组件回调
    },
    resetToDefaultAnalysisMode: () => setAnalysisMode("amp60"),
  }));

  return (  
    <div ref={containerRef} id="joyplot-container" style={{ position: "relative" }}>
      {showControls && controlsTargetRef.current &&
        createPortal(
          <JoyplotControls
            filter={exploratoryState.filter}
            sort={exploratoryState.sort}
            onFilterChange={({ type, value }) =>
              setExploratoryState(prev => ({
                ...prev,
                filter: { type, value }
              }))
            }
            onSortChange={sort =>
              setExploratoryState(prev => ({
                ...prev,
                sort
              }))
            }
          />,
          controlsTargetRef.current
        )
      }

      {showToggle && toggleRef.current &&
        createPortal(
          <button 
            onClick={() => {
              const newMode = nextMode;  // "spec60" 或 "amp60"
              setAnalysisMode(newMode);

              // 通知父组件：模式已切换
              if (callbackToggleRef.current) {
                console.log("3. callbackToggleRef.current 存在，正在调用！");
                callbackToggleRef.current?.(newMode);   // ← 这里调用 onModeSwitch 回调
              } else {
                console.log("3. callbackToggleRef.current 为 null，无法通知父组件！");
              }
            }}
          >
            Toggle to {nextModeLabel} Data
          </button>,
          toggleRef.current
        )
      }

    </div>
  );
});

export default JoyplotBase;


