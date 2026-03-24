import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import Papa from "papaparse";
import "../../styles/top50Songs.css";
import { registerHandlers } from "../../components/registerHandlers";
import { applyHandlers } from "../../components/applyHandlers";
import { stopPlayback } from "./info/stopPlayback";
import { triggerPlottingTimelineForSongs } from "./info/triggerPlottingTimelineForSongs";
import { backToBaseSquares } from "./info/backToBaseSquares";
import { triggerDrawReleaseYearDensity } from "./info/triggerDrawReleaseYearDensity";
import { backToTimelineWithSquares } from "./info/backToTimelineWithSquares";
import { triggerCompareWithArtist } from "./info/triggerCompareWithArtist";
import { triggerCompareWithAlbum } from "./info/triggerCompareWithAlbum";
import { backToTimelineWithKDE } from "./info/backToTimelineWithKDE";
import { addPopularitiesForSongs } from "./info/addPopularitiesForSongs";
import { backToCompareWithAlbum } from "./info/backToCompareWithAlbum";
import { triggerDrawPopularityDensity } from "./info/triggerDrawPopularityDensity";
import { backToPopularitiesForSongs } from "./info/backToPopularitiesForSongs";
import { triggerDrawPopularityDensityOfAllSongs } from "./info/triggerDrawPopularityDensityOfAllSongs";
import { backToOneKDE } from "./info/backToOneKDE";
import { backToBaseSquaresAgain } from "./info/backToBaseSquaresAgain";
import { backTo2KDE } from "./info/backTo2KDE";
import { genreCompare } from "./info/genreCompare";
import { drawGenreTreemap } from "./info/drawGenreTreemap";
import { genreCompareToBaseSquares } from "./info/genreCompareToBaseSquares";
import { treemapToGenreCompare } from "./info/treemapToGenreCompare";
import { moodCompare } from "./info/moodCompare";
import { switchMoodGroup } from "./info/switchMoodGroup";
import { drawMoodTreemap } from "./info/drawMoodTreemap";
import { moodCompareToGenreTreemap } from "./info/moodCompareToGenreTreemap";
import { drawSankeyChart } from "./info/drawSankeyChart";
import { sankeyChartToMoodTreemap } from "./info/sankeyChartToMoodTreemap";

const BaseSquares = forwardRef((_, ref) => {
  const [songs, setSongs] = useState([]);
  const containerRef = useRef(null);
  // 👈 只创建一次
  const audioPlayer = new Audio();
  const currentClusterRef = useRef(null);
  const timelineContextForSongsRef = useRef(null);
  const popularityContextRef = useRef(null);
  const kdeContextFromStep1Ref = useRef(null);

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
        }));
        setSongs(data);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (songs.length === 0) return;
    const container = containerRef.current;

    const cols = 10;
    const size = 90; // 每个 cluster 的边长
    const gap = 40;
    const offsetX = 110; // cluster距离container的offset
    const offsetY = 50;

    if (!container) return;
    container.replaceChildren(); // 比 innerHTML = "" 更安全

    // 创建 tooltip（只需一次）
    const tooltip = document.createElement("div");
    tooltip.className = "songs-tooltip";
    container.appendChild(tooltip);

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i]; // ✅ song 是对象 {id, name, artist}
      if (!song) continue;

      // 行列计算
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = offsetX + col * (size + gap);
      const y = offsetY + row * (size + gap);

      const el = document.createElement("div");
      el.className = "top50-songs";

      // 用歌名生成音频路径
      const audioFileName = `${song.song}.mp3`;          // 或 `${song.song} - ${song.artist}.mp3`
      const audioURL = `/audios/trimed_10s_audio/${audioFileName}`;
      
      // ✅ 给每个元素加唯一标识
      el.dataset.id = song.id;
      el.dataset.song = song.song;
      el.dataset.artist = song.artist;
      el.dataset.album = song.album;
      el.dataset.audio = audioURL;  // 保存音频路径

      // visual style
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.height = `${size}px`;
      el.style.width = `${size}px`;

      el.dataset.audioStatus = "idle"; // 音频播放初始化状态
      el.dataset.state = "initial";
      el.dataset.left = x;
      el.dataset.top = y;

      const artists = song.artist.split(",").map(a => a.trim());
      el.innerHTML = `
        <div class="song-title">${song.song}</div>
        <div class="song-artists">
          ${artists.map(a => `<div class="artist-line">${a}</div>`).join("")}
        </div>
      `;

      if (!el._handlers) el._handlers = {};

      const initialMouseEnter = (e) => {
        if (el.dataset.state !== "initial") return;
        if (el.dataset.audioStatus !== "playing") {
          el.style.transform = `scale(1.1)`;
        }
        updateTooltip(el);
        tooltip.style.opacity = 1;
      };
      const initialMouseMove = (e) => {
        tooltip.style.left = e.clientX + 12 + "px";
        tooltip.style.top = e.clientY + 12 + "px";
      };
      const initialMouseLeave = () => {
        if (el.dataset.state !== "initial") return;
        if (el.dataset.audioStatus !== "playing") {
          el.style.transform = `scale(1)`;
        }
        tooltip.style.opacity = 0;
      };
      const initialClick = () => {
        if (el.dataset.state !== "initial") return;
        if (currentClusterRef.current === el) {
          // 点击同一个 cluster
          if (el.dataset.audioStatus === "playing") {
            audioPlayer.pause();
            el.dataset.audioStatus = "paused";
            el.classList.remove("playing-highlight");
            el.style.transform = "scale(1)";
          } else if (el.dataset.audioStatus === "paused") {
            audioPlayer.play();
            el.dataset.audioStatus = "playing";
            el.classList.add("playing-highlight");
            el.style.transform = "scale(1.1)";
          }
        } else {
          // 点击不同 cluster
          if (currentClusterRef.current) {
            currentClusterRef.current.dataset.audioStatus = "idle";
            currentClusterRef.current.classList.remove("playing-highlight");
            currentClusterRef.current.style.transform = "scale(1)";
          }

          audioPlayer.src = el.dataset.audio;
          audioPlayer.play();
          el.dataset.audioStatus = "playing";
          el.classList.add("playing-highlight");
          el.style.transform = "scale(1.1)";

          currentClusterRef.current = el;
        }
        updateTooltip(el);
      };

      el.style.pointerEvents = "auto";
      container.appendChild(el);

      // 保存 initial handlers
      registerHandlers(el, "initial", {
        mouseenter: initialMouseEnter,
        mousemove: initialMouseMove,
        mouseleave: initialMouseLeave,
        click: initialClick
      });

      // 应用 initial handlers
      applyHandlers(el, "initial");
    }

    // 音频结束后自动重置
    audioPlayer.addEventListener("ended", () => {
      if (currentClusterRef.current) {
        currentClusterRef.current.dataset.audioStatus = "idle";
        currentClusterRef.current.classList.remove("playing-highlight");
        currentClusterRef.current.style.transform = "scale(1)";
        updateTooltip(currentClusterRef.current);
        currentClusterRef.current = null;
      }
    });

    function updateTooltip(el) {
      switch(el.dataset.audioStatus) {
        case "idle":
          tooltip.textContent = "Click to listen a song clip";
          break;
        case "playing":
          tooltip.textContent = "Click to pause";
          break;
        case "paused":
          tooltip.textContent = "Click to continue";
          break;
      }
    }
  }, [songs]);

  useImperativeHandle(ref, () => ({
    pause: () => stopPlayback(audioPlayer, currentClusterRef.current),
    triggerPlottingTimelineForSongs: () => {
      const context = triggerPlottingTimelineForSongs(containerRef, songs);
      timelineContextForSongsRef.current = context;
    },
    backToBaseSquares: () => backToBaseSquares(containerRef, songs),
    triggerDrawReleaseYearDensity: () => triggerDrawReleaseYearDensity(containerRef, timelineContextForSongsRef.current),
    backToTimelineWithSquares: () => backToTimelineWithSquares(containerRef, timelineContextForSongsRef.current),
    triggerCompareWithArtist: () => triggerCompareWithArtist(containerRef, songs, timelineContextForSongsRef.current),
    triggerCompareWithAlbum: () => triggerCompareWithAlbum(containerRef, songs, timelineContextForSongsRef.current),
    backToTimelineWithKDE: () => backToTimelineWithKDE(containerRef, songs, timelineContextForSongsRef.current),
    addPopularitiesForSongs: () => {
      const popContext = addPopularitiesForSongs(containerRef, songs, timelineContextForSongsRef.current);
      popularityContextRef.current = popContext;
    },
    backToCompareWithAlbum: () => backToCompareWithAlbum(containerRef, songs, timelineContextForSongsRef.current),
    triggerDrawPopularityDensity: () => {
      const top50Context = triggerDrawPopularityDensity(songs, popularityContextRef.current);
      kdeContextFromStep1Ref.current = top50Context;
    },
    backToPopularitiesForSongs: () => backToPopularitiesForSongs(songs, popularityContextRef.current),
    triggerDrawPopularityDensityOfAllSongs: () => triggerDrawPopularityDensityOfAllSongs(popularityContextRef.current, kdeContextFromStep1Ref.current),  
    backToOneKDE: () => backToOneKDE(popularityContextRef.current, kdeContextFromStep1Ref.current),
    backToBaseSquaresAgain: () => backToBaseSquaresAgain(containerRef, songs),
    backTo2KDE: () => backTo2KDE(containerRef),
    genreCompare: () => genreCompare(containerRef, songs),
    drawGenreTreemap: () => drawGenreTreemap(containerRef.current),
    genreCompareToBaseSquares: () => genreCompareToBaseSquares(containerRef, songs),
    genreTreemapToGenreCompare: () => treemapToGenreCompare("Genre", containerRef.current),
    moodCompare: () => moodCompare(containerRef, songs),
    moodCategoryCompare: () => switchMoodGroup(containerRef, "mood-group"),
    drawMoodTreemap: () => drawMoodTreemap(containerRef.current),
    moodCompareToGenreTreemap: () => moodCompareToGenreTreemap(containerRef.current),
    moodCategoryCompareToMoodCompare: () => switchMoodGroup(containerRef, "mood"),
    moodTreemapToMoodCategoryCompare: () => treemapToGenreCompare("Mood", containerRef.current),
    drawSankeyChart: () => drawSankeyChart(containerRef.current, songs),
    sankeyChartToMoodTreemap: () => sankeyChartToMoodTreemap(containerRef.current)
  }));

  return <div ref={containerRef} id="topsongs-container"></div>;
});

export default BaseSquares;

