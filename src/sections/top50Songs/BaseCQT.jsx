import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import Papa from "papaparse";
import "../../styles/cqt.css";
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
  const beatIndexRef = useRef(0);
  // ⭐ NEW：当前歌曲（这里先写死 Holiday，后面可以扩展）
  const currentSongRef = useRef(null);
  const [currentSong, setCurrentSong] = useState(null);
  const beatCanvasRef = useRef(null); // ⭐ NEW
  const beatPulsesRef = useRef([]); // ⭐ NEW

  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

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

  // -----------------------
  // Animation loop
  // -----------------------
  const animationLoop = () => {
    if (!canvasRef.current || !plotRef.current) return;
    if (!isPlayingRef.current) return;

    // ✅ 用 audio 推进 timeline（仅在播放时）
    timelineRef.current = audioRef.current.currentTime;

    const currentTime = getCurrentTime();

    const times = canvasRef.current.getFrameTimes();
    if (!times || times.length === 0) return;

    const totalFrames = times.length;

    let frameIndex = times.findIndex(t => t > currentTime);
    if (frameIndex === -1) {
      frameIndex = totalFrames - 1;
    } else {
      frameIndex = Math.max(0, frameIndex - 1);
    }

    const plot = plotRef.current;
    const left = plot.left + (frameIndex / totalFrames) * plot.width;

    setPlayheadLeft(left);

    const progress = Math.min(1, (frameIndex + 1) / totalFrames);
    setClipPath(`inset(0 0 0 ${progress * 100}%)`);

    const frame = canvasRef.current.getFrame(frameIndex);
    // if (frame) frameBarRef.current?.updateFrame(frame);
    if (frame) setCurrentFrame(frame);

    // ⭐ NEW：beat detection
    const song = currentSongRef.current;

    if (song && song.beat_position?.length) {
      const beats = song.beat_position;

      while (
        beatIndexRef.current < beats.length &&
        beats[beatIndexRef.current] <= currentTime
      ) {
        beatPulsesRef.current.push({
          time: beats[beatIndexRef.current],
          createdAt: currentTime, // ⭐ 用 audio time
        });

        beatIndexRef.current++;
      }
    }

    const PULSE_DURATION = 0.25; // ⭐ NEW（0.2~0.4 最合适）

    beatPulsesRef.current.forEach(p => {
      const age = currentTime - p.createdAt;

      // 归一化 0~1
      const t = age / PULSE_DURATION;

      // ⭐ life（快速衰减）
      p.life = 1 - t;

      // ⭐ scale（扩散）
      p.scale = 1 + t * 8;
    });
    
    // 移除过期
    beatPulsesRef.current = beatPulsesRef.current.filter(p => p.life > 0);

    // draw pulses
    const canvas = beatCanvasRef.current;

    if (canvas && plotRef.current) {
      const ctx = canvas.getContext("2d");

      const width = plotRef.current.width;
      const height = plotRef.current.height;

      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);

      beatPulsesRef.current.forEach(p => {
        const x = (p.time / 60) * width;
        const y = height / 2;

        const radius = p.scale * 3;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        ctx.globalAlpha = p.life;
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;

        ctx.stroke();
      });

      ctx.globalAlpha = 1;
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

    // 6️⃣ overlay 🔥（关键补充）
    setClipPath("inset(0 0 0 0%)");

    // 7️⃣ FrameBar 🔥（更稳）
    const frame0 = canvasRef.current?.getFrame(0);
    if (frame0) {
      setCurrentFrame(frame0);   // ✅ 直接驱动 UI
    }

    // ⭐ NEW 
    beatPulsesRef.current = []; // ⭐ NEW
    beatIndexRef.current = 0;

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
      setCurrentFrame(frame0);
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

          {/* {modeState === "explore" && showSelector && (
            <div className="cqt-explore-panel">
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
          )} */}

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

          {/* Spectrogram canvas */}
          <div className="cqt-spectrogram-wrapper">
            <CreateCQTCanvas 
              ref={canvasRef}
              dataPath={currentSong?.cqtPath}
              onDataReady={(data) => {
                const plot = canvasRef.current.getPlotArea();

                if (!plot) return;

                plotRef.current = plot;

                setNoteLabels(data.note_labels);
                setFrameWidth(plot.width / plot.frameCount);
                setBinHeight(plot.height / plot.binCount);
                setPlayheadLeft(plot.left);
                resetPlayback();
              }}
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

            {showPlayhead && (
              <div 
                className="cqt-playhead"
                style={{
                  // left: captureBox.left,
                  left: playheadLeft,
                  top: captureBox.top - 10,
                  height: captureBox.height + 20
                }}>
              </div>
            )}
            
            {/* ⭐ NEW：beat overlay canvas */}
            <canvas
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
              }}
            />

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

          {/* FrameBar */}
          {/* {showFrameBar && (
            <FrameBar
              bins={72}
              noteLabels={noteLabels}
              rectWidth={binHeight}
              values={currentFrame} 
            />
          )} */}
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