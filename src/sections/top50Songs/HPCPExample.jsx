import { forwardRef, useImperativeHandle, useRef, useState, useEffect, useMemo } from "react";
import * as d3 from "d3";
import Papa from "papaparse";
import "../../styles/hpcpExample.css";
import LegendBar from "./audioFeature/hpcp/LegendBar";
import HPCPCanvasPlus from "./audioFeature/hpcp/HPCPCanvasPlus";

const HPCPExample = forwardRef((_, ref) => {
  const [songs, setSongs] = useState(false);
  const [mergedSongs, setMergedSongs] = useState([]);
  const [domain, setDomain] = useState([0, 1]);

  // ⭐ NEW：当前歌曲（这里先写死 Holiday，后面可以扩展）
  const [currentSong, setCurrentSong] = useState(null);

  const scale = useMemo(() => {
    return d3.scaleSequential()
      .domain(domain)
      .interpolator(d3.interpolateViridis);
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
        beat_position: song.beat_positon,   
        hpcpPath: `/data/hpcp/${song.artist} - ${song.song}_HPCP.json`,
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


  // 暴露给 Scrollama 调用的方法
  useImperativeHandle(ref, () => ({
    hideCaptureBox: () => setShowCapture(false),
  }));

  // 完全使用react进行layout
  return (
    <div id="hpcp-example-container">

      <div className="hpcp-example-left">
        <div className="hpcp-example-stage">
          {/* Header */}
          <div className="hpcp-example-header-container">
            <div className="hpcp-example-header">
              <h2 className="hpcp-example-title">
                HPCP Spectrogram of "{currentSong?.song || ''}"
              </h2>
            </div>
          </div>

          <div className="hpcp-example-legend-wrapper">
            <LegendBar 
              colorScale={scale}
              domain={domain}
              label="Energy"
            />
            <div className="hpcp-example-legend-labels">
              <span>low</span>
              <span>high</span>
            </div>
          </div>
          

          {/* Spectrogram canvas */}
          <div className="hpcp-example-spectrogram-wrapper">
            <HPCPCanvasPlus 
              className="hpcp-example-spectrogram-canvas"
              dataPath={currentSong?.hpcpPath}
              onDataReady={(data) => {
                const allValues = data.values.flat().sort((a, b) => a - b);
                const min = d3.quantile(allValues, 0.02);
                const max = d3.quantile(allValues, 0.98);
                setDomain([min, max]);
              }}           
              colorScale={scale}   // ⭐ 新增              
            />           
          </div>
        </div>
      </div>

    </div>
  );
});

export default HPCPExample;