import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import * as d3 from "d3";
import Papa from "papaparse";
import "../../styles/hpcp.css";
import { loadInstrumentsData } from "./audioFeature/hpcp/loadInstrumentsData";
import HPCPCanvas from "./audioFeature/hpcp/HPCPCanvas";
import CQTCanvas from "./audioFeature/hpcp/CQTCanvas";

const HPCPComparision = forwardRef((_, ref) => {
  // 变量定义
  // mode state
  const [mode, setMode] = useState("cqt");
  const [playingIndex, setPlayingIndex] = useState(null); // null 表示没有播放
  const audioRef = useRef(null);

  // 播放音频函数
  // const playSound = (audioPath) => {
  //   const audio = new Audio(audioPath);
  //   audio.play();
  // };
  const playSound = (audioPath, idx) => {
    // 如果点击同一个正在播放的按钮 → 停止
    if (playingIndex === idx) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingIndex(null);
      return;
    }

    // 停掉之前播放的
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // 新建 audio 并播放
    const audio = new Audio(audioPath);
    audio.play();

    // 保存 ref
    audioRef.current = audio;
    setPlayingIndex(idx);

    // 播放结束自动清空状态
    audio.onended = () => {
      setPlayingIndex(null);
      audioRef.current = null;
    };
  };

  
  // 加载数据
  const [instruments, setInstruments] = useState([]);
  useEffect(() => {
    loadInstrumentsData().then(data => setInstruments(data));
  }, []);

  // 暴露给 Scrollama 调用的方法
  useImperativeHandle(ref, () => ({
    showCaptureBox: () => {},
  }));

  // 完全使用react进行layout
  return (
    <div id="hpcp-comparision-container">

      <div className="hpcp-comparision-left">
        <div className="hpcp-comparision-stage">
          
          {/* Title */}
          <div className="hpcp-comparision-title">
            <h2>音色对比：CQT vs HPCP</h2>
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
                {/* 图名 */}
                <div className="instrument-name">{inst.name}</div>

                {/* 播放按钮 */}
                <button
                  className={`play-button ${playingIndex === idx ? "playing" : ""}`}
                  onClick={() => playSound(inst.audio, idx)}
                >
                  ▶
                </button>

                {/* Canvas: CQT / HPCP */}
                <div className="instrument-canvas">
                  {mode === "cqt" ? (
                    <CQTCanvas data={inst.cqtData.values} width={300} height={200} />
                  ) : (
                    <HPCPCanvas data={inst.hpcpData.values} width={400} height={200} />
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
});

export default HPCPComparision;