import { forwardRef, useImperativeHandle, useRef, useState, useEffect, useMemo } from "react";
import * as d3 from "d3";
import Papa from "papaparse";
import "../../styles/hpcpCircle.css";
import CreateHPCPCircle from "./audioFeature/hpcp/CreateHPCPCircle";

const HPCPCircle = forwardRef((_, ref) => {
  const [songs, setSongs] = useState(false);
  const [mergedSongs, setMergedSongs] = useState([]);
  const [hpcpSongs, setHpcpSongs] = useState([]);
  const [domainMean, setDomainMean] = useState([0, 1]); // 全局all songs的hpcp值之domain
  const [domainVar, setDomainVar] = useState([0, 1]);

  const colorScaleMean = useMemo(() => {
    return d3.scaleSequential()
      .domain(domainMean)
      .interpolator(d3.interpolateViridis);
  }, [domainMean]);

  const colorScaleVar = useMemo(() => {
    return d3.scaleSequential()
      .domain(domainVar)
      .interpolator(d3.interpolateInferno); // 后面修改为与cqt/hpcp都不同的颜色映射
  }, [domainVar]);

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
        key: song.key,
        scale: song.scale,
        hpcpPath: `/data/hpcp/${song.artist} - ${song.song}_HPCP.json`,
      };
    });
    setMergedSongs(merged);
  }, [songs]);

  // fetch hpcp data and compute
  function computePitchStats(values) {
    const PITCH_COUNT = 12;

    const pitch = [];

    for (let pc = 0; pc < PITCH_COUNT; pc++) {

      const arr = values.map(frame => frame[pc]);

      const mean = d3.mean(arr);

      const variance = d3.variance(arr);

      pitch.push({
        pc,
        mean: mean || 0,
        variance: variance || 0
      });
    }

    return pitch;
  }

  useEffect(() => {
    if (!mergedSongs.length) return;

    const loadAll = async () => {
      const results = await Promise.all(
        mergedSongs.map(async (song) => {
          try {
            const res = await fetch(song.hpcpPath);
            const json = await res.json();

            const values = json.values; // [frame][12]

            if (!values || !values.length) return null;

            const pitchStats = computePitchStats(values);

            return {
              ...song,
              pitch: pitchStats
            };

          } catch (err) {
            console.error("HPCP load error:", song.song, err);
            return null;
          }
        })
      );

      const cleaned = results.filter(Boolean);
      console.log("Expected:", mergedSongs.length);
      console.log("Loaded:", cleaned.length);

      // 找缺失的
      const missing = mergedSongs.filter(
        s => !cleaned.find(c => c.song === s.song && c.artist === s.artist)
      );
      console.log("Missing songs:", missing);

      setHpcpSongs(cleaned);
    };

    loadAll();
    
  }, [mergedSongs]);

  // 计算 global domainMean
  useEffect(() => {
    if (!hpcpSongs.length) return;

    const allMeans = hpcpSongs.flatMap(s =>
      s.pitch.map(p => p.mean)
    );

    setDomainMean([
      0,
      d3.max(allMeans)
    ]);

  }, [hpcpSongs]);

  // 计算 global domainVar
  useEffect(() => {
    if (!hpcpSongs.length) return;

    const allVars = hpcpSongs.flatMap(s =>
      s.pitch.map(p => p.variance)
    );

    setDomainVar([
      0,
      d3.max(allVars)
    ]);

  }, [hpcpSongs]);  

  // 暴露给 Scrollama 调用的方法
  useImperativeHandle(ref, () => ({
    hideCaptureBox: () => setShowCapture(false),
  }));

  // 完全使用react进行layout
  return (
    <div id="hpcp-circle-container">
      <div className="hpcp-circle-layout">
        <div className="hpcp-circle-left">
          <CreateHPCPCircle
            songs={hpcpSongs}
            colorScaleMean={colorScaleMean}
            colorScaleVar={colorScaleVar}
          />
        </div>

        <div className="hpcp-circle-right">
        </div>
      </div>
    </div>
  );
});

export default HPCPCircle;