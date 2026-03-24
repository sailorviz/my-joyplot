import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import * as d3 from "d3";
import Papa from "papaparse";
import "../../styles/fourCurves.css";
import { createKDEChart } from "./audioFeature/fourCurves/createKDEChart";
import { createSongInteractionController } from "./audioFeature/fourCurves/createSongInteractionController";
import { zoomToKDE } from "./audioFeature/fourCurves/zoomToKDE";
import { resetKDEZoom } from "./audioFeature/fourCurves/resetKDEZoom";
import { projectSongsToFeatureWithState } from "./audioFeature/fourCurves/projectSongsToFeatureWithState";
import { resetSongDivs } from "./audioFeature/fourCurves/resetSongDivs";
import { backToFeature } from "./audioFeature/fourCurves/backToFeature";

const FourCurvesBase = forwardRef((_, ref) => {
  const [songs, setSongs] = useState([]);
  const containerRef = useRef(null);
  const featureScales = {}; // 全局或者 useRef 保存
  const kdeChartsRef = useRef({});
  const featureStatesRef = useRef({
    dissonance: null,
    bpm: null,
    danceability: null,
    dynamic_complexity: null
  });

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
          dissonance: row.dissonance ? +row.dissonance : NaN,
          bpm: row.bpm ? +row.bpm : NaN,
          danceability: row.danceability ? +row.danceability : NaN,
          dynamic_complexity: row.dynamic_complexity ? +row.dynamic_complexity : NaN,
        }));
        setSongs(data);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!songs || songs.length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    // 清空 container（保留 React 管理的容器节点本身）
    container.replaceChildren();

    // ---------- 先创建并隐藏每首歌对应的 cluster div（保留数据与 DOM） ----------
    const size = 15; // 每个 cluster 的边长

    const tooltip = document.createElement("div");
    tooltip.className = "song-tooltip";
    container.appendChild(tooltip);

    // const kdeTooltip = document.createElement("div");
    // kdeTooltip.className = "four-kde-tooltip";
    // container.appendChild(kdeTooltip);

    const controller = createSongInteractionController({
      tooltip,
      kdeCharts: kdeChartsRef.current // ✅ 传入所有 KDE chart 实例
    });

    songs.forEach((song) => {
      const cluster = document.createElement("div");
      cluster.className = "four-curves-songs";
      cluster.dataset.id = song.id;
      cluster.dataset.song = song.song;
      cluster.dataset.artist = song.artist;
      cluster.dataset.album = song.album;
      cluster.dataset.dissonance = String(song.dissonance);
      cluster.dataset.bpm = String(song.bpm);
      cluster.dataset.danceability = String(song.danceability);
      cluster.dataset.dynamic_complexity = String(song.dynamic_complexity);

      const audioFileName = `${song.song}.mp3`;
      cluster.dataset.audio = `/audios/trimed_10s_audio/${audioFileName}`;

      cluster.innerHTML = `
        <div class="song-dot">
          <div class="play-icon"></div>
        </div>
      `;

      cluster.style.position = "absolute";
      cluster.style.left = "0px";
      cluster.style.top = "0px";
      cluster.style.width = `${size}px`;
      cluster.style.height = `${size}px`;
      cluster.style.display = "none";

      container.appendChild(cluster);

      // 🔹 绑定交互（controller 内部直接操作 kdeCharts）
      controller.bind(cluster);
    });

    // ---------- 创建 KDE 图 ----------
    const kdeGrid = document.createElement("div");
    kdeGrid.className = "kde-grid";
    container.appendChild(kdeGrid);

    const features = {
      dissonance: songs.map(d => d.dissonance).filter(v => !isNaN(v)),
      bpm: songs.map(d => d.bpm).filter(v => !isNaN(v)),
      danceability: songs.map(d => d.danceability).filter(v => !isNaN(v)),
      dynamic_complexity: songs.map(d => d.dynamic_complexity).filter(v => !isNaN(v)),
    };

    const featureOrder = [
      { key: "dissonance", label: "Dissonance", color: "#d62728" },
      { key: "bpm", label: "BPM", color: "#1f77b4" },
      { key: "danceability", label: "Danceability", color: "#2ca02c" },
      { key: "dynamic_complexity", label: "Dynamic Complexity", color: "#9467bd" },
    ];

    featureOrder.forEach(({ key, label, color }) => {
      const values = features[key];
      const card = document.createElement("div");
      card.className = `kde-card kde-card-${key}`;
      kdeGrid.appendChild(card);

      const title = document.createElement("div");
      title.className = "kde-card-title";
      title.textContent = label;
      title.style.opacity = 0;
      card.appendChild(title);

      const chart = createKDEChart({
        card,
        values,
        featureKey: key,
        color,
        height: 160,
        margin: { top: 10, right: 10, bottom: 20, left: 30 }
      });
      chart.init();

      kdeChartsRef.current[key] = chart;
      featureScales[key] = chart.getXScale();
    });

  }, [songs]);

  useImperativeHandle(ref, () => ({
    zoomToDissonanceKDE: () => zoomToKDE(containerRef.current, "dissonance"),
    resetKDEZoom: () => resetKDEZoom(containerRef.current),
    projectSongsToDissonance: () => projectSongsToFeatureWithState(containerRef.current, featureScales, "dissonance", featureStatesRef.current),
    resetSongDivs: () => resetSongDivs(containerRef.current),
    zoomTobpmKDE: () => zoomToKDE(containerRef.current, "bpm"),
    projectSongsToBPM: () => projectSongsToFeatureWithState(containerRef.current, featureScales, "bpm", featureStatesRef.current),
    zoomToDanceabilityKDE: () => zoomToKDE(containerRef.current, "danceability"),
    projectSongsToDanceability: () => projectSongsToFeatureWithState(containerRef.current, featureScales, "danceability", featureStatesRef.current),
    zoomToDynamicComplexityKDE: () => zoomToKDE(containerRef.current, "dynamic_complexity"),
    projectSongsToDynamicComplexity: () => projectSongsToFeatureWithState(containerRef.current, featureScales, "dynamic_complexity", featureStatesRef.current),
    backToDissonance: () => backToFeature(containerRef.current, "dissonance", featureStatesRef.current),
    backToBPM: () => backToFeature(containerRef.current, "bpm", featureStatesRef.current),
    backToDanceability: () => backToFeature(containerRef.current, "danceability", featureStatesRef.current),
  }));

  return <div ref={containerRef} id="four-curves-container" style={{ position: "relative" }}></div>;
});

export default FourCurvesBase;


