import { switchHandlers } from "../../../components/switchHandlers";
import { registerHandlers } from "../../../components/registerHandlers";
import { moodColorMap, moodGroupMap, moodCategoryColors } from "../../../components/moodColorMap";
import { updateBarColor } from "./updateBarColor";

/**
 * 初始化 mood bars，并支持切换 mood / mood-group 模式
 * @param {Object} containerRef - React ref 对象
 * @param {Array} songs - songs 数据数组
 * @param {String} mode - 初始模式 "mood" 或 "mood-group"
 */
export function moodCompare(containerRef, songs, mode = "mood") {
  const treemap = containerRef.current.querySelector(".Genre-treemap");
  if (treemap) treemap.remove();
  const treemapTooltip = containerRef.current.querySelector(".treemap-tooltip");
  if (treemapTooltip) treemapTooltip.remove();

  const clusterElsNodeList = containerRef.current.querySelectorAll(".top50-songs");
  const clusters = Array.from(clusterElsNodeList);
  const tooltip = containerRef.current.querySelector(".songs-tooltip");
  const rect = containerRef.current.getBoundingClientRect();

  clusters.forEach((el) => {
    const id = el.dataset.id;
    const song = songs[id];
    const name = song.song;
    const artist = song.artist;
    const moods = song.mood.split(",").map(m => m.trim() || "");
    const groups = moods.map(m => moodGroupMap[m] || "");

    // 生成三段 mood-bar
    el.innerHTML = `
      <div class="mood-bars">
        <div class="mood-bar" data-mood="${moods[0] || ""}" data-group="${groups[0] || ""}"></div>
        <div class="mood-bar" data-mood="${moods[1] || ""}" data-group="${groups[1] || ""}"></div>
        <div class="mood-bar" data-mood="${moods[2] || ""}" data-group="${groups[2] || ""}"></div>
      </div>
    `;

    el.style.overflow = "hidden";
    el.style.opacity = 1;
    el.style.pointerEvents = "auto";

    if (!el._handlers) el._handlers = {};
    registerHandlers(el, "mood", {
      mouseenter: () => {},
      mousemove: () => {},
      mouseleave: () => {},
    });

    el.dataset.state = mode;
    switchHandlers(el, "genre", "mood");

    const bars = el.querySelectorAll(".mood-bar");

    // 初始化颜色
    bars.forEach(bar => {
      bar.dataset.state = mode;
      updateBarColor(bar, mode);

      // hover tooltip
      bar.addEventListener("mouseenter", (e) => {
        bar.classList.add("hovered");
        bar.textContent = (bar.dataset.state === "mood") ? bar.dataset.mood
                          : (bar.dataset.state === "mood-group") ? bar.dataset.group : "";
        bar.style.color = "#fff";
        bar.style.fontSize = "12px";
        bar.style.fontWeight = "bold";
        bar.style.display = "flex";
        bar.style.alignItems = "center";
        bar.style.justifyContent = "center";

        tooltip.innerHTML = `
          <strong>${name} - ${artist}</strong>
        `;
        tooltip.style.opacity = 1;
        tooltip.style.left = `${e.clientX - rect.left + 10}px`;
        tooltip.style.top  = `${e.clientY - rect.top - 40}px`;
      });

      bar.addEventListener("mousemove", (e) => {
        tooltip.style.left = `${e.clientX - rect.left + 10}px`;
        tooltip.style.top  = `${e.clientY - rect.top - 40}px`;
      });

      bar.addEventListener("mouseleave", () => {
        bar.classList.remove("hovered");
        bar.textContent = "";
        tooltip.style.opacity = 0;
      });
    });
  });
}




