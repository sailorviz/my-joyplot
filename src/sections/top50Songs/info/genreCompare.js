import { switchHandlers } from "../../../components/switchHandlers";
import { getGenreColors } from "./getGenreColors";
import { registerHandlers } from "../../../components/registerHandlers";
import { genreColorMap } from "../../../components/genreColorMap";

export function genreCompare(containerRef, songs){
  const clusterElsNodeList = containerRef.current.querySelectorAll(".top50-songs");
  const clusters = Array.from(clusterElsNodeList);
  const tooltip = containerRef.current.querySelector(".songs-tooltip");
  const rect = containerRef.current.getBoundingClientRect();

  clusters.forEach((el) => {
    const id = el.dataset.id;
    const song = songs[id];
    const name = song.song;
    const artist = song.artist;
    const genre = song.genre;

    const [c1, c2, c3] = getGenreColors(genre, genreColorMap);

    // 1. 填入三段颜色 bar
    el.innerHTML = `
      <div class="genre-bars">
        <div class="genre-bar" data-genre="${song.genre.split(",")[0].trim() || ""}" style="background:${c1};"></div>
        <div class="genre-bar" data-genre="${song.genre.split(",")[1].trim() || ""}" style="background:${c2};"></div>
        <div class="genre-bar" data-genre="${song.genre.split(",")[2].trim() || ""}" style="background:${c3};"></div>
      </div>
    `;

    // 2. 用 JS 覆盖默认背景（不改 CSS）
    el.style.overflow = "hidden";

    // 3. 停用 square 的交互：只让 bar 可交互
    if (!el._handlers) el._handlers = {};
    registerHandlers(el, "genre", {
      mouseenter: () => {},
      mousemove: () => {},
      mouseleave: () => {},
    });

    el.dataset.state = "genre";
    switchHandlers(el, "initial", "genre");
    el.style.pointerEvents = "auto";

    // 4. 添加 bar 的独立交互
    const bars = el.querySelectorAll(".genre-bar");

    bars.forEach((bar) => {
      const barGenre = bar.dataset.genre;

      bar.addEventListener("mouseenter", (e) => {
        bar.classList.add("hovered");
        // e.stopPropagation();   // ⭐关键：阻止事件冒泡到 square

        // bar 上显示 genre 文本
        bar.textContent = barGenre;
        bar.style.color = "#fff";
        bar.style.fontSize = "12px";
        bar.style.fontWeight = "bold";
        bar.style.display = "flex";
        bar.style.alignItems = "center";
        bar.style.justifyContent = "center";

        // tooltip 显示 歌名 - 歌手名
        tooltip.innerHTML = `${name} - ${artist}`;
        tooltip.style.opacity = 1;
        tooltip.style.left = `${e.clientX - rect.left + 10}px`;
        tooltip.style.top  = `${e.clientY - rect.top - 40}px`;
      });

      bar.addEventListener("mousemove", (e) => {
        // e.stopPropagation();   // ⭐关键
        tooltip.style.left = `${e.clientX - rect.left + 10}px`;
        tooltip.style.top  = `${e.clientY - rect.top - 40}px`;
      });

      bar.addEventListener("mouseleave", (e) => {
        bar.classList.remove("hovered");
        // e.stopPropagation();   // ⭐关键

        // 恢复 bar
        bar.textContent = "";
        tooltip.style.opacity = 0;
      });
    });
  });
}
