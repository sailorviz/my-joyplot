// import { switchHandlers } from "../../../components/switchHandlers";
// // import { getGenreColors } from "./getGenreColors";
// import { registerHandlers } from "../../../components/registerHandlers";
// import { moodColorMap, moodGroupMap, moodCategoryColors } from "../../../components/moodColorMap";

// export function moodCompare(containerRef, songs){
//   const treemap = containerRef.current.querySelector(".genre-treemap");
//   if (treemap) treemap.remove();

//   const clusterElsNodeList = containerRef.current.querySelectorAll(".top50-songs");
//   const clusters = Array.from(clusterElsNodeList);
//   clusters.forEach(el => {
//     el.style.opacity = 1;
//     el.style.pointerEvents = "auto";
//   })

//   const tooltip = containerRef.current.querySelector(".songs-tooltip");
//   const rect = containerRef.current.getBoundingClientRect();

//   clusters.forEach((el) => {
//     const id = el.dataset.id;
//     const song = songs[id];
//     const name = song.song;
//     const artist = song.artist;
//     const mood = song.mood;

//     // const [c1, c2, c3] = getGenreColors(mood, moodColorMap);

//     const moods = mood.split(",").map(m => m.trim() || "");
//     const groups = moods.map(m => moodGroupMap[m] || "");

//     // 1. 填入三段颜色 bar
//     // el.innerHTML = `
//     //   <div class="mood-bars">
//     //     <div class="mood-bar" data-mood="${moods[0] || ""}" data-group="${groups[0] || ""}" style="background:${c1};"></div>
//     //     <div class="mood-bar" data-mood="${moods[1] || ""}" data-group="${groups[1] || ""}" style="background:${c2};"></div>
//     //     <div class="mood-bar" data-mood="${moods[2] || ""}" data-group="${groups[2] || ""}" style="background:${c3};"></div>
//     //   </div>
//     // `;
//     el.innerHTML = `
//       <div class="mood-bars">
//         <div class="mood-bar" data-mood="${moods[0] || ""}" data-group="${groups[0] || ""}"></div>
//         <div class="mood-bar" data-mood="${moods[1] || ""}" data-group="${groups[1] || ""}"></div>
//         <div class="mood-bar" data-mood="${moods[2] || ""}" data-group="${groups[2] || ""}"></div>
//       </div>
//     `;


//     // 2. 用 JS 覆盖默认背景（不改 CSS）
//     el.style.overflow = "hidden";

//     // 3. 停用 square 的交互：只让 bar 可交互
//     if (!el._handlers) el._handlers = {};
//     registerHandlers(el, "mood", {
//       mouseenter: () => {},
//       mousemove: () => {},
//       mouseleave: () => {},
//     });

//     el.dataset.state = "mood";
//     switchHandlers(el, "genre", "mood");
//     el.style.pointerEvents = "auto";

//     // 4. 添加 bar 的独立交互
//     const bars = el.querySelectorAll(".mood-bar");

//     bars.forEach((bar) => {
//       const barMood = bar.dataset.mood;
//       const barGroup = bar.dataset.group;

//       bar.dataset.state = "mood";
//       if (bar.dataset.state === "mood") {
//         bar.style.background = moodColorMap[barMood];
//       } else if (bar.dataset.state === "mood-group"){
//         bar.style.background = moodCategoryColors[barGroup];
//       } else {
//         bar.style.background = "none";
//       }

//       bar.addEventListener("mouseenter", (e) => {
//         bar.classList.add("hovered");
//         // e.stopPropagation();   // ⭐关键：阻止事件冒泡到 square

//         // bar 上显示 mood 文本
//         if (bar.dataset.state === "mood") {
//           bar.textContent = barMood;
//         } else if (bar.dataset.state === "mood-group"){
//           bar.textContent = barGroup;
//         } else {
//           bar.textContent = "";
//         }

//         bar.style.color = "#fff";
//         bar.style.fontSize = "12px";
//         bar.style.fontWeight = "bold";
//         bar.style.display = "flex";
//         bar.style.alignItems = "center";
//         bar.style.justifyContent = "center";

//         // tooltip 显示 歌名 - 歌手名
//         tooltip.innerHTML = `${name} - ${artist}`;
//         tooltip.style.opacity = 1;
//         tooltip.style.left = `${e.clientX - rect.left + 10}px`;
//         tooltip.style.top  = `${e.clientY - rect.top - 40}px`;
//       });

//       bar.addEventListener("mousemove", (e) => {
//         // e.stopPropagation();   // ⭐关键
//         tooltip.style.left = `${e.clientX - rect.left + 10}px`;
//         tooltip.style.top  = `${e.clientY - rect.top - 40}px`;
//       });

//       bar.addEventListener("mouseleave", (e) => {
//         bar.classList.remove("hovered");
//         // e.stopPropagation();   // ⭐关键

//         // 恢复 bar
//         bar.textContent = "";
//         tooltip.style.opacity = 0;
//       });
//     });
//   });
// }

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

        tooltip.innerHTML = `${name} - ${artist}`;
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




