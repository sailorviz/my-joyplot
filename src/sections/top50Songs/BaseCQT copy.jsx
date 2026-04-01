import { forwardRef, useImperativeHandle, useRef, useState, useEffect, useMemo } from "react";
import * as d3 from "d3";
import Papa from "papaparse";
import "../../styles/cqt.css";
import LegendBar from "./audioFeature/hpcp/LegendBar";
import CreateCQTCanvas from "./audioFeature/cqt/CreateCQTCanvas";
import FrameBar from "./audioFeature/cqt/FrameBar";
import { extractSongTitleFromFilename } from "../../components/extractSongTitleFromFilename";

const BaseCQT = forwardRef((_, ref) => {
  const [modeState, setModeState] = useState("story");
  const [songs, setSongs] = useState(false);
  const [waveforms60s, setWaveforms60s] = useState([]);
  const [spectralCentroid60s, setSpectralCentroid60s] = useState([]);
  const [mergedSongs, setMergedSongs] = useState([]);
  const canvasRef = useRef(null);
  const plotRef = useRef(null);

  const [showCapture, setShowCapture] = useState(false);
  const [captureBox, setCaptureBox] = useState(null);
  
  const [showFrameBar, setShowFrame] = useState(false);

  const [noteLabels, setNoteLabels] = useState([]);
  const [frameWidth, setFrameWidth] = useState(0);
  const [binHeight, setBinHeight] = useState(0);

  const [showPlayhead, setShowPlayhead] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  const [domain, setDomain] = useState([0, 1]);

  // animation相关
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);  // 绑定音频
  const animationRef = useRef(null); // rAF 控制
  const [playheadLeft, setPlayheadLeft] = useState(0); // captureBox.left
  const [clipPath, setClipPath] = useState("inset(0 0 0 0%)");
  const timelineRef = useRef(0); 
  const [currentFrame, setCurrentFrame] = useState(null);
  // ⭐ NEW：beat pointer
  // const beatIndexRef = useRef(0);
  // ⭐ NEW：当前歌曲（这里先写死 Holiday，后面可以扩展）
  const currentSongRef = useRef(null);
  const [currentSong, setCurrentSong] = useState(null);
  // const beatCanvasRef = useRef(null); // ⭐ NEW
  const beatPulsesRef = useRef([]); // ⭐ NEW

  // ⭐ 新增 Beat Pulse 相关
  const beatCanvasRef = useRef(null);
  const activePulsesRef = useRef([]);     // 当前正在闪烁的脉冲
  // const beatIndexRef = useRef(0);         // 当前处理到的 beat 索引

  // ⭐ Playhead Beat Flash
  const [isPlayheadFlashing, setIsPlayheadFlashing] = useState(false);
  const lastFlashTimeRef = useRef(0);
  const beatIndexRef = useRef(0);
  const precomputedBeatXRef = useRef([]);   // 预计算的 beat X 坐标
  const nextBeatIndexRef = useRef(0);       // 当前要检测的下一个 beat

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  const scale = useMemo(() => {
    return d3.scaleSequential()
      .domain(domain)
      .interpolator(d3.interpolateInferno);
  }, [domain]);

  // 加载songs数据
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
          popularity: row.popularity?.trim() || "",
          release_year: row.release_year?.trim() || "",
          genre: row.genre?.trim() || "",
          mood: row.mood?.trim() || "",
          if_top30artists: row.if_top30artists?.trim() || "",
          if_top30albums: row.if_top30albums?.trim() || "",
          dissonance: row.dissonance?.trim() || "",
          bpm: row.bpm?.trim() || "",
          danceability: row.danceability?.trim() || "",
          dynamic_complexity: row.dynamic_complexity?.trim() || "",
          duration: row.duration?.trim() || "",
          key: row.key?.trim() || "",
          scale: row.scale?.trim() || "",
          instrument: row.instrument?.trim() || "",  
          beat_positon: row.beat_positon?.trim() || "",        
        }));
        setSongs(data);
      })
      .catch((err) => console.error(err));
  }, []);

  // 加载spectral centroid & amplitude envelope数据
  // 加载 60sAmplitude 数据文件
  useEffect(() => {
    d3.json("/data/amplitude_envelope_60s_0.5s.json").then(setWaveforms60s);
  }, []);

  const [processedWaveforms60s, setProcessedWaveforms60s] = useState([]);
  useEffect(() => {
    if (!waveforms60s.length) return;
    const processed = waveforms60s.map(w => ({
      ...w,
      song_name: extractSongTitleFromFilename(w.file_name)
    }));
    setProcessedWaveforms60s(processed);
  }, [waveforms60s]);

  // 加载 60s spectral centroid 数据文件
  useEffect(() => {
    d3.json("/data/spectral_centroids_60s_0.5s.json").then(setSpectralCentroid60s);
  }, []);

  const [processedSpectralCentroid60s, setProcessedSpectralCentroid60s] = useState([]);
  useEffect(() => {
    if (!spectralCentroid60s.length) return;
    const processed = spectralCentroid60s.map(w => ({
      ...w,
      song_name: extractSongTitleFromFilename(w.file_name)
    }));
    setProcessedSpectralCentroid60s(processed);
  }, [spectralCentroid60s]);

  // 生成mergedSongs
  useEffect(() => {
    if (
      !songs.length ||
      !processedWaveforms60s.length ||
      !processedSpectralCentroid60s.length
    ) return;

    // 创建 Map，key = song_name，value = waveform 对象
    const waveformMap60s = new Map(
      processedWaveforms60s.map(w => [w.song_name, w])
    );
    const spectralCentroidMap60s = new Map(
      processedSpectralCentroid60s.map(w => [w.song_name, w])
    );

    // ⭐ FIX：解析 beat_position（CSV → array）
    const parseBeatPositions = (str) => {
      if (!str) return [];
      try {
        return JSON.parse(str).filter(t => t <= 60);
      } catch {
        return [];
      }
    };

    const merged = songs.map((song, index) => {
      const waveform60s = waveformMap60s.get(song.song);
      const spectralCentroids60s = spectralCentroidMap60s.get(song.song);

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
        beat_position: parseBeatPositions(song.beat_positon),   
        amplitude_60s: waveform60s?.waveform || [],
        spectral_60s: spectralCentroids60s?.spectral_centroid || [],
        cqtPath: `/data/cqt/${song.artist} - ${song.song}_CQT.json`,
        audioPath: `/audios/trimed_60s_audio/${song.artist} - ${song.song}.mp3`,
      };
    });
    setMergedSongs(merged);
  }, [songs,processedWaveforms60s, processedSpectralCentroid60s]);

  useEffect(() => {
    if (!mergedSongs.length) return;

    const song = mergedSongs.find(s => s.song === "Holiday"); // ⭐ NEW
    setCurrentSong(song);

    beatIndexRef.current = 0;      // ⭐ NEW reset
    beatPulsesRef.current = [];   // ⭐ NEW reset

  }, [mergedSongs]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const labels = canvasRef.current.getNoteLabels();
    const plot = canvasRef.current.getPlotArea();
    plotRef.current = plot;

    if (!labels || !plot) return;   // 再次安全检查
    
    setNoteLabels(labels);
    setFrameWidth(plot.width / plot.frameCount);
    setBinHeight(plot.height / plot.binCount);
    setPlayheadLeft(plot.left);  // ✅ 初始位置同步

  }, [canvasRef.current]);

  const getCurrentTime = () => {
    return timelineRef.current;
  };

  // 当 plot 和 currentSong 都准备好时计算 beat 位置
  // // ⭐⭐⭐ 新的 Beat X 预计算逻辑（解决时序问题）
  // useEffect(() => {
  //   const computeBeats = () => {
  //     if (!currentSong?.beat_position?.length) return;
  //     if (!plotRef.current?.width || plotRef.current.width < 100) return;

  //     const plot = plotRef.current;

  //     const beatsX = currentSong.beat_position.map(time => {
  //       const progress = Math.max(0, Math.min(1, time / 60));
  //       return plot.left + progress * plot.width;
  //     });

  //     precomputedBeatXRef.current = beatsX;
  //     nextBeatIndexRef.current = 0;

  //     console.log(`✅ 成功预计算 ${beatsX.length} 个 beat 位置 | width=${plot.width}`);
  //   };

  //   computeBeats();

  //   // 每当 plot 更新时也尝试计算（兜底）
  //   const interval = setInterval(computeBeats, 100); // 短时间轮询
  //   setTimeout(() => clearInterval(interval), 1500);   // 最多轮询1.5秒

  // }, [currentSong]);
  useEffect(() => {
    if (!currentSong?.beat_position?.length) return;
    if (!plotRef.current?.width) return;

    const plot = plotRef.current;

    const beatsX = currentSong.beat_position.map(time => {
      const p = Math.max(0, Math.min(1, time / 60));
      return plot.left + p * plot.width;
    });

    precomputedBeatXRef.current = beatsX;
    nextBeatIndexRef.current = 0;

  }, [currentSong, plotRef.current?.width]);

  // -----------------------
  // Animation loop
  // -----------------------
  // const animationLoop = () => {
  //   if (!canvasRef.current || !plotRef.current) return;
  //   if (!isPlayingRef.current) return;

  //   // ✅ 用 audio 推进 timeline（仅在播放时）
  //   timelineRef.current = audioRef.current.currentTime;

  //   const currentTime = getCurrentTime();

  //   const times = canvasRef.current.getFrameTimes();
  //   if (!times || times.length === 0) return;

  //   const totalFrames = times.length;

  //   let frameIndex = times.findIndex(t => t > currentTime);
  //   if (frameIndex === -1) {
  //     frameIndex = totalFrames - 1;
  //   } else {
  //     frameIndex = Math.max(0, frameIndex - 1);
  //   }

  //   const plot = plotRef.current;
  //   // const left = plot.left + (frameIndex / totalFrames) * plot.width;

  //   // setPlayheadLeft(left);
  //   // === Playhead 位置（推荐用这个，最稳）===
  //   // const progress = Math.max(0, Math.min(1, currentTime / 60));
  //   const progress = Math.min(1, (frameIndex + 1) / totalFrames);
  //   const newLeft = plot.left + progress * plot.width;

  //   if (Math.abs(newLeft - playheadLeft) > 0.5) {
  //     setPlayheadLeft(newLeft);
  //   }

  //   setClipPath(`inset(0 0 0 ${progress * 100}%)`);

  //   const frame = canvasRef.current.getFrame(frameIndex);
  //   if (frame) {
  //     setCurrentFrame(frame);        // 强制更新
  //   }

  //   // // ⭐ NEW：beat detection
  //   // const song = currentSongRef.current;
  //   // const duration = 60; // audio时长

  //   // if (song && song.beat_position?.length) {
  //   //   const beats = song.beat_position;

  //   //   while (
  //   //     beatIndexRef.current < beats.length &&
  //   //     beats[beatIndexRef.current] <= currentTime
  //   //   ) {
  //   //     beatPulsesRef.current.push({
  //   //       time: beats[beatIndexRef.current],
  //   //       createdAt: currentTime, // ⭐ 用 audio time
  //   //     });

  //   //     beatIndexRef.current++;
  //   //   }
  //   // }

  //   // const PULSE_DURATION = 0.25; // ⭐ NEW（0.2~0.4 最合适）

  //   // beatPulsesRef.current.forEach(p => {
  //   //   const age = currentTime - p.createdAt;

  //   //   // 归一化 0~1
  //   //   const t = age / PULSE_DURATION;

  //   //   // ⭐ life（快速衰减）
  //   //   p.life = 1 - t;

  //   //   // ⭐ scale（扩散）
  //   //   p.scale = 1 + t * 8;

  //   // });
    
  //   // // 移除过期
  //   // beatPulsesRef.current = beatPulsesRef.current.filter(p => p.life > 0);

  //   // // draw pulses
  //   // const canvas = beatCanvasRef.current;

  //   // if (canvas && plotRef.current) {
  //   //   const ctx = canvas.getContext("2d");

  //   //   const width = plotRef.current.width;
  //   //   const height = plotRef.current.height;

  //   //   canvas.width = width;
  //   //   canvas.height = height;

  //   //   ctx.clearRect(0, 0, width, height);

  //   //   beatPulsesRef.current.forEach(p => {
  //   //     // const x = (p.time / 60) * width;
  //   //     const x = (p.time / duration) * width;
  //   //     const y = height / 2;

  //   //     const radius = p.scale * 3;

  //   //     ctx.beginPath();
  //   //     ctx.arc(x, y, radius, 0, Math.PI * 2);

  //   //     ctx.globalAlpha = p.life;
  //   //     ctx.strokeStyle = "white";
  //   //     ctx.lineWidth = 2;

  //   //     ctx.stroke();
  //   //   });

  //   //   ctx.globalAlpha = 1;
  //   // }

  //   // // ====================== Playhead Beat Flash ======================
  //   // const song = currentSongRef.current;

  //   // if (song?.beat_position?.length) {
  //   //   const beats = song.beat_position;

  //   //   while (
  //   //     beatIndexRef.current < beats.length &&
  //   //     beats[beatIndexRef.current] <= currentTime + 0.03
  //   //   ) {
  //   //     const beatTime = beats[beatIndexRef.current];

  //   //     // 防止同一帧多次触发
  //   //     if (currentTime - lastFlashTimeRef.current > 0.08) {
  //   //       setIsPlayheadFlashing(true);
  //   //       lastFlashTimeRef.current = currentTime;

  //   //       // 200ms 后自动关闭闪光（可调）
  //   //       setTimeout(() => {
  //   //         setIsPlayheadFlashing(false);
  //   //       }, 180);
  //   //     }

  //   //     beatIndexRef.current++;
  //   //   }
  //   // }

  //   // === Beat Flash：判断 playhead 是否经过下一个 beat X ===
  //   const beatXs = precomputedBeatXRef.current;
  //   if (beatXs.length > 0 && nextBeatIndexRef.current < beatXs.length) {
  //     const nextBeatX = beatXs[nextBeatIndexRef.current];

  //     if (newLeft >= nextBeatX) {
  //       // 触发闪烁
  //       setIsPlayheadFlashing(true);
  //       setTimeout(() => setIsPlayheadFlashing(false), 160);

  //       nextBeatIndexRef.current++;   // 移动到下一个 beat
  //     }
  //   }

  //   animationRef.current = requestAnimationFrame(animationLoop);
  // };
  // -----------------------
  // -----------------------
  // Animation loop
  // -----------------------
  const animationLoop = () => {
    if (!isPlayingRef.current || !canvasRef.current || !plotRef.current) {
      animationRef.current = requestAnimationFrame(animationLoop);
      return;
    }

    const currentTime = audioRef.current.currentTime;
    timelineRef.current = currentTime;

    const times = canvasRef.current.getFrameTimes();
    if (!times || times.length === 0) {
      animationRef.current = requestAnimationFrame(animationLoop);
      return;
    }

    const totalFrames = times.length;

    // === 核心：全部使用 frameIndex 计算 ===
    let frameIndex = times.findIndex(t => t > currentTime);
    if (frameIndex === -1) {
      frameIndex = totalFrames - 1;
    } else {
      frameIndex = Math.max(0, frameIndex - 1);
    }

    const duration = audioRef.current.duration || 60;

    const progress = Math.min(
      1,
      currentTime / duration
    );

    const plot = plotRef.current;
    const newLeft = plot.left + progress * plot.width;


    // const progress = Math.min(1, (frameIndex + 1) / totalFrames);
    // const newLeft = plot.left + progress * plot.width;

    setPlayheadLeft(newLeft);
    setClipPath(`inset(0 0 0 ${progress * 100}%)`);

    // 更新当前帧给 FrameBar
    const frame = canvasRef.current.getFrame(frameIndex);
    if (frame && frame !== currentFrame) {
      setCurrentFrame(frame);
    }

    // // === Beat Flash：基于 frameIndex 判断是否经过 beat ===
    // const beatXs = precomputedBeatXRef.current;
    // if (beatXs.length > 0 && nextBeatIndexRef.current < beatXs.length) {
    //   const nextBeatX = beatXs[nextBeatIndexRef.current];

    //   if (newLeft >= nextBeatX - 2) {          // 小容差
    //     setIsPlayheadFlashing(true);
    //     setTimeout(() => setIsPlayheadFlashing(false), 150);
    //     nextBeatIndexRef.current++;
    //   }
    // }
    // === Beat Flash 诊断日志 ===
    // const beatXs = precomputedBeatXRef.current;
    // if (beatXs.length > 0 && nextBeatIndexRef.current < beatXs.length) {
    //   const nextBeatX = beatXs[nextBeatIndexRef.current];
    //   const currentLeft = newLeft;
    //   const progress = (currentLeft - plot.left) / plot.width;

    //   // 每帧打印一次关键信息（方便观察）
    //   if (Math.random() < 0.05) {   // 每20帧打印一次，避免刷屏太快
    //     console.log(`Progress: ${(progress*100).toFixed(1)}% | CurrentLeft: ${currentLeft.toFixed(1)} | NextBeatX: ${nextBeatX.toFixed(1)} | Diff: ${(currentLeft - nextBeatX).toFixed(1)}`);
    //   }

    //   if (currentLeft >= nextBeatX - 8) {     // 再加大一点容差
    //     console.log(`🔥 BEAT FLASH TRIGGERED! at ${currentLeft.toFixed(1)} (beat at ${nextBeatX.toFixed(1)})`);
    //     setIsPlayheadFlashing(true);
    //     setTimeout(() => setIsPlayheadFlashing(false), 180);
    //     nextBeatIndexRef.current++;
    //   }
    // } else if (beatXs.length === 0) {
    //   console.log("⚠️ BeatXs is empty!");
    // }

    const beats = currentSongRef.current?.beat_position;
    if (!beats || nextBeatIndexRef.current >= beats.length) return;

    while (
      nextBeatIndexRef.current < beats.length &&
      beats[nextBeatIndexRef.current] <= currentTime
    ) {
      setIsPlayheadFlashing(true);
      setTimeout(() => setIsPlayheadFlashing(false), 150);

      nextBeatIndexRef.current++;
    }

    animationRef.current = requestAnimationFrame(animationLoop);
  };


  const handlePlayPause = () => {
    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      setIsPlaying(true);

      audioRef.current.currentTime = timelineRef.current; // ✅ 对齐
      audioRef.current.play();

      animationRef.current = requestAnimationFrame(animationLoop);
    } else {
      // 🔥 核心：冻结时间
      timelineRef.current = audioRef.current.currentTime;

      isPlayingRef.current = false;
      setIsPlaying(false);

      audioRef.current.pause();
      cancelAnimationFrame(animationRef.current);
    }
  };

  const resetPlayback = () => {
    console.log("Reset - Plot width:", plotRef.current?.width);
    // 1️⃣ 停止动画
    cancelAnimationFrame(animationRef.current);
    animationRef.current = null;

    // 2️⃣ 状态
    isPlayingRef.current = false;
    setIsPlaying(false);

    // 3️⃣ 时间归零
    timelineRef.current = 0;

    // 4️⃣ 音频
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // 5️⃣ playhead
    if (plotRef.current) {
      setPlayheadLeft(plotRef.current.left);
    }
    nextBeatIndexRef.current = 0;
    // precomputedBeatXRef.current = [];
    setIsPlayheadFlashing(false);

    // 6️⃣ overlay 🔥（关键补充）
    setClipPath("inset(0 0 0 0%)");

    // 7️⃣ FrameBar 🔥（更稳）
    const frame0 = canvasRef.current?.getFrame(0);
    if (frame0) {
      setCurrentFrame(frame0);   // ✅ 直接驱动 UI
    }

    // ⭐ NEW 
    // beatPulsesRef.current = []; // ⭐ NEW
    // beatIndexRef.current = 0;

    // activePulsesRef.current = [];
    // beatIndexRef.current = 0;

    // ⭐🔥 真正解决残留
    const canvas = beatCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      resetPlayback();
    };

    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  
  // 暴露给 Scrollama 调用的方法
  useImperativeHandle(ref, () => ({
    showCaptureBox: () => {
      if (!canvasRef.current) return;
      if (!plotRef.current) return;
      setCaptureBox({
        left: plotRef.current.left,
        top: plotRef.current.top,
        width: frameWidth,
        height: plotRef.current.height
      });

      setShowCapture(true);
    },

    hideCaptureBox: () => setShowCapture(false),

    showFirstFrame: () => {
      setShowFrame(true); // 先渲染 FrameBar

      const frame0 = canvasRef.current.getFrame(0);
      if (frame0) setCurrentFrame(frame0);
    },

    hideFrameBar: () => setShowFrame(false),
    showPlayButton: () => setShowPlayButton(true),
    showPlayhead: () => setShowPlayhead(true),
    hidePlayButton: () => setShowPlayButton(false),
    hidePlayhead: () => setShowPlayhead(false),
    showOverlay: () => setShowOverlay(true),
    hideOverlay: () => setShowOverlay(false),
    resetPlayback: () => resetPlayback(),
    showPulse: () => setShowPulse(true),
    hidePulse: () => setShowPulse(false),

    enterExploreMode: () => {
      resetPlayback();
      setModeState("explore");
      setShowSelector(true);
    },
    exitExploreMode: () => {
      resetPlayback();
      setModeState("story");
      setShowSelector(false);
    },
    
    backToDefaultedSong: () => {
      const song = mergedSongs.find(s => s.song === "Holiday"); // ⭐ NEW
      setCurrentSong(song);
    },
  }));

  // 完全使用react进行layout
  return (
    <div id="cqt-container">

      <div className="cqt-left">
        <div className="cqt-stage">
          {/* Header */}
          <div className="cqt-header-container">
            <div className="cqt-header">
              <h2 className="cqt-title">
                Spectrogram of "{currentSong?.song || ''}"
              </h2>
              {showPlayButton && (
                <button className="cqt-play" onClick={handlePlayPause}>
                  {isPlaying ? "⏸ Pause" : "▶ Play"}
                </button>
              )}
            </div>
          </div>

          <div className={`cqt-explore-panel ${modeState === "explore" && showSelector ? "visible" : "hidden"}`}>
            <select
              value={currentSong?.id || ""}
              onChange={(e) => {
                const song = mergedSongs.find(s => s.id === e.target.value);
                setCurrentSong(song);
              }}
            >
              <option value="" disabled>Select a song</option>

              {mergedSongs.map(s => (
                <option key={s.id} value={s.id}>
                  {s.song} - {s.artist}
                </option>
              ))}
            </select>
          </div>

          <div className="cqt-legend-wrapper">
            <LegendBar 
              colorScale={scale}
              domain={domain}
              label="Energy"
            />
            <div className="cqt-legend-labels">
              <span>low</span>
              <span>high</span>
            </div>
          </div>
          

          {/* Spectrogram canvas */}
          <div className="cqt-spectrogram-wrapper">
            <CreateCQTCanvas 
              ref={canvasRef}
              dataPath={currentSong?.cqtPath}
              // onDataReady={(data) => {
              //   const allValues = data.values.flat().sort((a, b) => a - b);
              //   const min = d3.quantile(allValues, 0.02);
              //   const max = d3.quantile(allValues, 0.98);
              //   setDomain([min, max]);

              //   const plot = canvasRef.current.getPlotArea();
              //   if (!plot) return;

              //   plotRef.current = plot;

              //   console.log("onDataReady: Plot updated, width =", plot.width);

              //   // 强制计算 beat X
              //   if (currentSong?.beat_position?.length > 0 && plot.width > 100) {
              //     const beatsX = currentSong.beat_position.map(time => {
              //       const p = Math.max(0, Math.min(1, time / 60));
              //       return plot.left + p * plot.width;
              //     });

              //     precomputedBeatXRef.current = beatsX;
              //     nextBeatIndexRef.current = 0;

              //     console.log(`✅ onDataReady 中强制填充 ${beatsX.length} 个 beat`);
              //   }

              //   setNoteLabels(data.note_labels);
              //   setFrameWidth(plot.width / plot.frameCount);
              //   setBinHeight(plot.height / plot.binCount);
              //   setPlayheadLeft(plot.left);
              //   resetPlayback();
              // }}
              onDataReady={(data) => {
                const allValues = data.values.flat().sort((a, b) => a - b);
                const min = d3.quantile(allValues, 0.02);
                const max = d3.quantile(allValues, 0.98);
                setDomain([min, max]);

                const plot = canvasRef.current.getPlotArea();
                if (!plot) return;

                plotRef.current = plot;

                // 立即计算 beat X
                if (currentSong?.beat_position?.length > 0) {
                  const beatsX = currentSong.beat_position.map(time => {
                    const p = Math.max(0, Math.min(1, time / 60));
                    return plot.left + p * plot.width;
                  });

                  precomputedBeatXRef.current = beatsX;
                  nextBeatIndexRef.current = 0;

                  console.log(`✅ onDataReady 立即预计算成功: ${beatsX.length} 个 beat`);
                }

                setNoteLabels(data.note_labels);
                setFrameWidth(plot.width / plot.frameCount);
                setBinHeight(plot.height / plot.binCount);
                setPlayheadLeft(plot.left);
                resetPlayback();
              }}
              colorScale={scale}   // ⭐ 新增
            />
            {/* 👇 遮罩层 */}
            {showOverlay && (
              <div
                className="cqt-overlay"
                style={{
                  left: plotRef.current?.left || 0,
                  top: plotRef.current?.top || 0,
                  width: plotRef.current?.width + 2 || 0,
                  height: plotRef.current?.height + 2 || 0,
                  clipPath: clipPath
                }}
              />
            )}

            <audio ref={audioRef} src={currentSong?.audioPath} />

            {/* {showPlayhead && (
              <div 
                className="cqt-playhead"
                style={{
                  // left: captureBox.left,
                  left: playheadLeft,
                  top: captureBox.top - 10,
                  height: captureBox.height + 20
                }}>
              </div>
            )} */}

            {/* {showPlayhead && (
              <div 
                className={`cqt-playhead ${isPlayheadFlashing ? "flash" : ""}`}
                style={{
                  left: playheadLeft,
                  top: captureBox?.top - 10 || 0,
                  height: (captureBox?.height || 0) + 20
                }}
              />
            )} */}
            {showPlayhead && (
              <div 
                className={`cqt-playhead ${isPlayheadFlashing ? "flash" : ""}`}
                style={{
                  left: playheadLeft,
                  top: (captureBox?.top || plotRef.current?.top || 0) - 15,
                  height: (captureBox?.height || plotRef.current?.height || 400) + 30,
                  borderLeft: isPlayheadFlashing ? "6px solid #fff" : "2.5px solid #fff",
                }}
              />
            )}
            
            {/* ⭐ NEW：beat overlay canvas */}
            {/* <canvas
              ref={beatCanvasRef}
              className="cqt-beat-layer"
              style={{
                position: "absolute",
                left: plotRef.current?.left || 0,
                top: plotRef.current?.top || 0,
                width: plotRef.current?.width || 0,
                height: plotRef.current?.height || 0,
                pointerEvents: "none",

                // ⭐ 用 opacity 控制显示
                opacity: showPulse ? 1 : 0,
                filter: "drop-shadow(0 0 6px rgba(255,255,255,0.9))", // 额外增强发光
              }}
            /> */}

            {showCapture && captureBox && (
              <div 
                className="cqt-capture-box"       
                style={{
                  left: captureBox.left,
                  top: captureBox.top,
                  width: captureBox.width,
                  height: captureBox.height
                }}>
              </div>
            )}

            
          </div>

          <div className={`cqt-framebar ${showFrameBar ? "visible" : "hidden"}`}>
            <FrameBar
              bins={72}
              noteLabels={noteLabels}
              rectWidth={binHeight}
              values={currentFrame} 
            />
          </div>


        </div>
      </div>

    </div>
  );
});

export default BaseCQT;