import { forwardRef, useImperativeHandle, useRef, useState, useEffect, useMemo } from "react";
import * as d3 from "d3";
import Papa from "papaparse";
import "../../styles/cqt.css";
import LegendBar from "./audioFeature/hpcp/LegendBar";
import CreateCQTCanvas from "./audioFeature/cqt/CreateCQTCanvas";
import FrameBar from "./audioFeature/cqt/FrameBar";

const BaseCQT = forwardRef((_, ref) => {
  const [modeState, setModeState] = useState("story");
  const [songs, setSongs] = useState(false);
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

  const audioRef = useRef(null);  // 绑定音频
  const overlayRef = useRef(null);
  const playheadRef = useRef(null);

  // animation相关
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(null);
  const rafRef = useRef(null);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);

  // ⭐ NEW：当前歌曲（这里先写死 Holiday，后面可以扩展）
  const currentSongRef = useRef(null);
  const [currentSong, setCurrentSong] = useState(null);
  const framesRef = useRef([]);
  const frameIndexRef = useRef(0);
  

  // ⭐ 新增 Beat Pulse 相关
  const beatEngineRef = useRef(null);

  // ⭐ Playhead Beat Flash
  const [isPlayheadFlashing, setIsPlayheadFlashing] = useState(false);


  // beat system (trigger)
  class BeatEngine {
    constructor(beats) {
      this.beats = beats || [];
      this.index = 0;
    }

    update(time, onBeat) {
      while (
        this.index < this.beats.length &&
        this.beats[this.index] <= time
      ) {
        onBeat(this.index, this.beats[this.index]);
        this.index++;
      }
    }

    reset() {
      this.index = 0;
    }
  }

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    if (showPulse) {
      beatEngineRef.current?.reset();
    }
  }, [showPulse]);

  useEffect(() => {
    if (currentSong?.beat_position) {
      beatEngineRef.current = new BeatEngine(currentSong.beat_position);
    }
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

  // 生成mergedSongs
  useEffect(() => {
    if (
      !songs.length 
    ) return;

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
        cqtPath: `/data/cqt/${song.artist} - ${song.song}_CQT.json`,
        audioPath: `/audios/trimed_60s_audio/${song.artist} - ${song.song}.mp3`,
      };
    });
    setMergedSongs(merged);
  }, [songs]);

  // set current song as "Holiday"
  useEffect(() => {
    if (!mergedSongs.length) return;

    const song = mergedSongs.find(s => s.song === "Holiday"); // ⭐ NEW
    setCurrentSong(song);

  }, [mergedSongs]);

  // 获取cqt canvas相关参数
  useEffect(() => {
    if (!canvasRef.current) return;

    const labels = canvasRef.current.getNoteLabels();
    const plot = canvasRef.current.getPlotArea();
    const frames = canvasRef.current.getFrames();
    plotRef.current = plot;
    framesRef.current = frames;

    if (!labels || !plot) return;   // 再次安全检查
    
    setNoteLabels(labels);
    setFrameWidth(plot.width / plot.frameCount);
    setBinHeight(plot.height / plot.binCount);
    // setPlayheadLeft(plot.left);  // ✅ 初始位置同步

  }, [canvasRef.current]);

  // 模块架构
  // position system (time → x)
  function computePlayheadX(time, duration, plot) {
    if (!plot) return 0; // ✅ 防御

    const progress = duration ? time / duration : 0;
    const clamped = Math.min(1, Math.max(0, progress));

    return plot.left + clamped * plot.width;
  }

  // frame system (time → frameIndex → frame)
  function getFrame(time, frameInterval, frames) {
    if (!frames || frames.length === 0) {
      return { index: 0, frame: null };
    }

    const index = Math.floor(time / frameInterval);
    const safeIndex = Math.min(frames.length - 1, index);

    return {
      index: safeIndex,
      frame: frames[safeIndex]
    };
  }

  // useAnimationLoop
  const loop = () => {
    console.log("loop is running");
    const audio = audioRef.current;
    const song = currentSongRef.current;

    if (!audio || !song) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    // time
    const now = performance.now();

    if (isPlayingRef.current) {
      const delta = (now - lastTimeRef.current) / 1000;
      timeRef.current += delta;
    }

    lastTimeRef.current = now;

    const time = timeRef.current;

    const duration = audio.duration || 1;

    const plot = plotRef.current;
    if (!plot) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const x = computePlayheadX(time, duration, plot);

    // playhead
    if (playheadRef.current) {
      playheadRef.current.style.left = `${x}px`;
    }

    // overlay
    if (overlayRef.current) {
      overlayRef.current.style.width = `${x - plot.left}px`;
    }

    // frame
    const { index, frame } = getFrame(time, 0.2, framesRef.current);

    if (frameIndexRef.current !== index) {
      setCurrentFrame(frame);
      frameIndexRef.current = index;
    }

    // beat（仅在 showPulse）
    if (showPulse && isPlayingRef.current) {
      beatEngineRef.current?.update(time, () => {
        setIsPlayheadFlashing(true);
        setTimeout(() => setIsPlayheadFlashing(false), 120);
      });
    }

    rafRef.current = requestAnimationFrame(loop);
  };

  const startAnimationLoop = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(loop);
  };

  const stopAnimationLoop = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  useEffect(() => {
    startAnimationLoop();   // 使用新函数

    return () => {
      stopAnimationLoop();
    };
  }, []);   // 仍然保持空依赖（组件挂载时启动一次）

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlayingRef.current) {
      // ▶️ PLAY
      isPlayingRef.current = true;
      setIsPlaying(true);

      lastTimeRef.current = performance.now();

      audio.play().catch(() => {});
    } else {
      // ⏸ PAUSE
      isPlayingRef.current = false;
      setIsPlaying(false);

      audio.pause();
    }
  };

  const resetPlayback = () => {
    // 1️⃣ 停止 RAF（🔥 核心修复）
    stopAnimationLoop();

    // 2️⃣ 状态
    isPlayingRef.current = false;
    setIsPlaying(false);

    // 3️⃣ 音频
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // ⭐ 重置系统时间（核心）
    timeRef.current = 0;

    // ⭐ 关键：重新对齐 RAF 时间基准
    lastTimeRef.current = performance.now();

    // 4️⃣ playhead（⚠️ 修复 px）
    if (playheadRef.current && plotRef.current) {
      playheadRef.current.style.left = `${plotRef.current.left}px`;
    }

    // 5️⃣ overlay
    if (overlayRef.current && plotRef.current) {
      overlayRef.current.style.width = `0px`;
    }

    // 6️⃣ FrameBar
    const frame0 = canvasRef.current?.getFrame(0);
    if (frame0) {
      setCurrentFrame(frame0);
      frameIndexRef.current = 0;
    }

    // 7️⃣ Beat reset
    beatEngineRef.current?.reset();
    setIsPlayheadFlashing(false);

    // 🔥 关键：重新启动 animation loop
    startAnimationLoop();
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
              onDataReady={(data) => {
                const allValues = data.values.flat().sort((a, b) => a - b);
                const min = d3.quantile(allValues, 0.02);
                const max = d3.quantile(allValues, 0.98);
                setDomain([min, max]);

                const plot = canvasRef.current.getPlotArea();
                if (!plot) return;

                plotRef.current = plot;

                if (playheadRef.current && plot) {
                  playheadRef.current.style.left = `${plot.left}px`;
                }

                setNoteLabels(data.note_labels);
                setFrameWidth(plot.width / plot.frameCount);
                setBinHeight(plot.height / plot.binCount);
                resetPlayback();
              }}
              colorScale={scale}   // ⭐ 新增
            />
            {/* 👇 遮罩层 */}
            {showOverlay && (
              <div
                ref={overlayRef}
                className="cqt-overlay"
                style={{
                  left: plotRef.current?.left || 0,
                  top: plotRef.current?.top || 0,
                  width: 0,
                  height: plotRef.current?.height + 2 || 0,
                }}
              />
            )}

            <audio ref={audioRef} src={currentSong?.audioPath} />


            {showPlayhead && (
              <div 
                ref={playheadRef}
                className={`cqt-playhead ${
                  showPulse && isPlayheadFlashing ? "flash" : ""
                }`}
                style={{
                  top: captureBox?.top - 10 || 0,
                  left: plotRef.current?.left || 0,
                  height: (captureBox?.height || 0) + 20
                }}
              />
            )} 
            
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