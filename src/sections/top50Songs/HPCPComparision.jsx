import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import Papa from "papaparse";
import "../../styles/hpcp.css";
import { loadInstrumentsData } from "./audioFeature/hpcp/loadInstrumentsData";
import HPCPCanvas from "./audioFeature/hpcp/HPCPCanvas";
import CQTCanvas from "./audioFeature/hpcp/CQTCanvas";
import LegendBar from "./audioFeature/hpcp/LegendBar";

const HPCPComparision = forwardRef((_, ref) => {
  // mode state
  const [mode, setMode] = useState("cqt");
  const [playingIndex, setPlayingIndex] = useState(null);

  const audioRef = useRef(null);

  // ✅ NEW: progress state（按 instrument 存）
  const [progressMap, setProgressMap] = useState({});
  // ✅ NEW
  const [pausedIndex, setPausedIndex] = useState(null);

  const playSound = (audioPath, idx) => {
    // 🟡 情况1：点击正在播放 → pause
    if (playingIndex === idx && audioRef.current) {
      audioRef.current.pause();
      setPlayingIndex(null);
      setPausedIndex(idx);
      return;
    }

    // 🟡 情况2：点击已暂停 → resume
    if (pausedIndex === idx && audioRef.current) {
      audioRef.current.play();
      setPlayingIndex(idx);
      setPausedIndex(null);
      return;
    }

    // 🔴 情况3：点击其他按钮 → stop previous + play new
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // ✅ reset

      // ✅ reset progress
      setProgressMap(prev => ({
        ...prev,
        [playingIndex]: 0,
        [pausedIndex]: 0
      }));
    }

    const audio = new Audio(audioPath);
    audio.play();

    audioRef.current = audio;
    setPlayingIndex(idx);
    setPausedIndex(null);

    // 进度更新
    audio.ontimeupdate = () => {
      if (!audio.duration) return;

      const progress = audio.currentTime / audio.duration;

      setProgressMap(prev => ({
        ...prev,
        [idx]: progress * 100
      }));
    };

    audio.onended = () => {
      setPlayingIndex(null);
      setPausedIndex(null);
      audioRef.current = null;

      setProgressMap(prev => ({
        ...prev,
        [idx]: 0
      }));
    };
  };

  // 加载数据
  const [instruments, setInstruments] = useState([]);
  useEffect(() => {
    loadInstrumentsData().then(data => setInstruments(data));
  }, []);

  useImperativeHandle(ref, () => ({
    showCaptureBox: () => {},
  }));

  // 计算domain and colorScale
  const [cqtDomain, setCqtDomain] = useState([0, 1]);
  const [hpcpDomain, setHpcpDomain] = useState([0, 1]);

  useEffect(() => {
    if (!instruments.length) return;

    let cqtValues = [];
    let hpcpValues = [];

    instruments.forEach(inst => {
      // CQT
      if (inst.cqtData?.values) {
        inst.cqtData.values.forEach(frame => {
          cqtValues.push(...frame);
        });
      }

      // HPCP
      if (inst.hpcpData?.values) {
        inst.hpcpData.values.forEach(frame => {
          hpcpValues.push(...frame);
        });
      }
    });

    if (cqtValues.length) {
      setCqtDomain([
        Math.min(...cqtValues),
        Math.max(...cqtValues)
      ]);
    }

    if (hpcpValues.length) {
      setHpcpDomain([
        Math.min(...hpcpValues),
        Math.max(...hpcpValues)
      ]);
    }

  }, [instruments]);

  const cqtScale = d3.scaleSequential(d3.interpolateInferno)
    .domain(cqtDomain);
  const hpcpScale = d3.scaleSequential(d3.interpolateViridis)
    .domain(hpcpDomain);


  return (
    <div id="hpcp-comparision-container">

      <div className="hpcp-comparision-left">
        <div className="hpcp-comparision-stage">

          {/* 🔧 MODIFIED: Title 区域去掉 instrument title */}
          <div className="hpcp-comparision-title">
            <h2>Timbre Comparision: CQT vs HPCP</h2>

            <div className="hpcp-comparision-selector">
              <label>
                <input
                  type="radio"
                  name="displayMode"
                  value="cqt"
                  checked={mode === "cqt"}
                  onChange={() => setMode("cqt")}
                />
                CQT
              </label>
              <label>
                <input
                  type="radio"
                  name="displayMode"
                  value="hpcp"
                  checked={mode === "hpcp"}
                  onChange={() => setMode("hpcp")}
                />
                HPCP
              </label>
            </div>
          </div>

          {/* 乐器 Blocks */}
          <div className="instrument-blocks">
            {instruments.map((inst, idx) => (
              <div key={idx} className="instrument-block">

                {/* ❌ REMOVED: instrument-name */}

                {/* 🔧 MODIFIED: button = title + progress */}
                <button
                  className={`
                    instrument-button 
                    ${playingIndex === idx ? "playing" : ""}
                    ${pausedIndex === idx ? "paused" : ""}
                  `}
                  onClick={() => playSound(inst.audio, idx)}
                >
                  {/* ✅ NEW: progress 背景层 */}
                  <div
                    className="progress"
                    style={{ width: `${progressMap[idx] || 0}%` }}
                  />

                  {/* 🔧 MODIFIED: label */}
                  <span className="instrument-label">
                    {playingIndex === idx
                      ? "⏸ "
                      : pausedIndex === idx
                      ? "▶ "
                      : "▶ "}
                    {inst.name}
                  </span>
                </button>

                {/* Canvas */}
                <div className="instrument-canvas">
                  {mode === "cqt" ? (
                    <CQTCanvas 
                      data={inst.cqtData} 
                      colorScale={cqtScale}
                    />
                  ) : (
                    <HPCPCanvas
                      data={inst.hpcpData}
                      colorScale={hpcpScale}
                    />
                  )}
                </div>

              </div>
            ))}

            <div className="legend-wrapper">
              <LegendBar 
                colorScale={mode === "cqt" ? cqtScale : hpcpScale}
                domain={mode === "cqt" ? cqtDomain : hpcpDomain}
                label={mode === "cqt" ? "CQT Energy" : "HPCP Energy"}
              />
              <div className="legend-labels">
                <span>weak</span>
                <span>strong</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
});

export default HPCPComparision;