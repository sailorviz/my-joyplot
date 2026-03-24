import { loadArtistPhoto } from "./loadArtistPhoto";
import { forClusterPosition } from "./forClusterPosition";
import { clusteringData } from "./clusteringData";

/**
 * animateClusterWithImages
 * @param {React.RefObject} containerRef - 容器 ref
 * @param {Object} clusterData - clustering 后的数据 { artist: { displayedSongs: [], remainingSongs: [] } }
 * @param {Object} artistPhotos - { [artistName]: URL }
 */

const clusterEls = {}; // artist -> DOM

export function animateClusterWithImages(containerRef, allSongs, artistInfos) {
  if (!containerRef?.current) return;
  const artistPhotos = loadArtistPhoto();

  console.log("=== animateClusterWithImages ===");
  console.log("containerRef:", containerRef.current);
  console.log("clusterEls keys:", Object.keys(clusterEls));

  Object.keys(artistPhotos).forEach(a => {
    if (!artistPhotos[a]) console.warn("❌ Missing photo:", a);
  });

  const clusterData = clusteringData(containerRef.current, allSongs);
  // const artistInfos = loadArtistInfo("/data/top30_artists.csv");
  // console.log("✅ artistInfos loaded:", artistInfos[0]);
  const rect = containerRef.current.getBoundingClientRect();

  // 创建 tooltip 元素
  // 只创建一次 tooltip
  let tooltip = containerRef.current.querySelector(".artist-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "artist-tooltip";
    Object.assign(tooltip.style, {
      position: "absolute",
      padding: "8px 12px",
      background: "rgba(0,0,0,0.75)",
      color: "white",
      borderRadius: "8px",
      fontSize: "12px",
      pointerEvents: "none", // ✅ 一定要有
      opacity: 0,
      transition: "opacity 0.2s ease",
      zIndex: 9999
    });
    containerRef.current.appendChild(tooltip);
  }

  forClusterPosition(containerRef, clusterData, ({ artist, data, clusterCenterX, clusterCenterY }) => {    
    let clusterEl = clusterEls[artist];

    if (!clusterEl) {
      clusterEl = document.createElement("div");
      clusterEl.className = "clusterForArtist";
      clusterEl.dataset.artist = artist;
      containerRef.current.appendChild(clusterEl);
      clusterEls[artist] = clusterEl;
    } else {
      // ✅ 如果已存在，清空旧内容（防止重复叠加）
      clusterEl.innerHTML = "";
    }

    const img = document.createElement("img");
    img.src = artistPhotos[artist];
    img.alt = artist;

    // 样式：保持原比例显示
    Object.assign(img.style, {
      width: "100%",         // 让图片占满容器宽度
      height: "auto",        // 自动按比例缩放
      objectFit: "contain",  // 保持完整，不裁剪
      borderRadius: "12px",  // 可选，让封面有点圆角
      display: "block",      // 去除底部间隙
    });

    // 设置外层容器尺寸与布局
    Object.assign(clusterEl.style, {
      position: "absolute",
      width: "150px",        // ✅ 你可以自由调整大小
      height: "auto",
      cursor: "pointer",
      transformOrigin: "center center",
      left: `${clusterCenterX}px`,
      top: `${clusterCenterY - 60}px`,
      // transform: "translate(0,0) scale(1)", // 🟦 明确初始 transform
    });

    // 🟦 保存初始位置状态
    // const rect = clusterEl.getBoundingClientRect();
    clusterEl.dataset.state = "initial";
    clusterEl.dataset.initialLeft = clusterCenterX;
    clusterEl.dataset.initialTop = clusterCenterY - 60;
    clusterEl.dataset.tx = 0;
    clusterEl.dataset.ty = 0;

    // clusterEl.dataset.initialLeft = rect.left;
    // clusterEl.dataset.initialTop = rect.top;
    // clusterEl.dataset.initialRight = rect.right;
    // clusterEl.dataset.initialWidth = rect.width;

    clusterEl.appendChild(img);
    
    // 淡入动画（加帧延迟）
    clusterEl.style.opacity = 0;
    requestAnimationFrame(() => {
      clusterEl.style.transition = "opacity 0.6s ease";
      clusterEl.style.opacity = 1;
      clusterEl.style.pointerEvents = "auto";
    });

    // 🟩 新增：确保 _handlers 容器存在（用来保存事件引用，便于 later remove）
    if (!clusterEl._handlers) clusterEl._handlers = {};
    
    // 🟩 初始（animateClusterWithImages）hover 处理器 - 命名函数并保存引用
    const initialMouseEnter = (e) => {
      if (clusterEl.dataset.state !== "initial") return; // 只在初始状态生效

      const scale = clusterEl.classList.contains("band-highlight") ? 1.2 : 1.1;
      clusterEl.style.transform = `scale(${scale})`;

      const focused = clusterEl.dataset.focused;
      if (!focused) {
        clusterEl.style.transform = "scale(1.1)";
      }

      if (clusterEl.classList.contains("band-highlight")){
        clusterEl.style.boxShadow = "0 0 25px #a0c4ff;";
      } else {
        clusterEl.style.boxShadow = "0 8px 16px rgba(0,0,0,0.3)";
      }

      const info = artistInfos[artist];
      if (!info) return;

      tooltip.innerHTML = `
        <strong>${artist}</strong><br/>
        Gender: ${info?.singer_sex || "Unknown"}<br/>
        Country: ${info?.Country || "Unknown"}<br/>
        Genre: ${info?.Genre || "Unknown"}<br/>
        Songs_Collected: ${info?.song_count || 0}
      `;

      tooltip.style.left = `${e.clientX - rect.left + 10}px`;
      tooltip.style.top = `${e.clientY - rect.top - 40}px`;
      tooltip.style.opacity = 1;
    };

      const initialMouseMove = (e) => {
      tooltip.style.left = `${e.clientX - rect.left + 10}px`;
      tooltip.style.top = `${e.clientY - rect.top - 40}px`;
    };

    const initialMouseLeave = () => {
      if (clusterEl.dataset.state !== "initial") return; // 只在初始状态生效
      const scale = clusterEl.classList.contains("band-highlight") ? 1.1 : 1;
      clusterEl.style.transform = `scale(${scale})`;
      if (clusterEl.classList.contains("band-highlight")){
        clusterEl.style.boxShadow = "0 0 25px #a0c4ff;";
      } else {
        clusterEl.style.boxShadow = "none";
      }

      const focused = clusterEl.dataset.focused;
      if (!focused) {
        clusterEl.style.transform = "scale(1)";
      }
      tooltip.style.opacity = 0;
    };

    // 🟩 保存引用
    clusterEl._handlers.initial = {
      mouseenter: initialMouseEnter,
      mousemove: initialMouseMove,
      mouseleave: initialMouseLeave
    };

    // 🟩 绑定初始 hover（首次创建或每次确保绑定）
    clusterEl.removeEventListener("mouseenter", initialMouseEnter);
    clusterEl.removeEventListener("mousemove", initialMouseMove);
    clusterEl.removeEventListener("mouseleave", initialMouseLeave);
    clusterEl.addEventListener("mouseenter", initialMouseEnter);
    clusterEl.addEventListener("mousemove", initialMouseMove);
    clusterEl.addEventListener("mouseleave", initialMouseLeave);

    // 隐藏 Other 的 song 元素
    data.displayedSongs.forEach(song => {
      const el = Array.from(containerRef.current.children).find(c => c.dataset.id === song.id);
      if (!el) return;
      el.style.transition = "all 0.5s ease";
      el.style.opacity = 0;
    });
    data.remainingSongs.forEach(song => {
      const el = Array.from(containerRef.current.children).find(c => c.dataset.id === song.id);
      if (!el) return;
      el.style.transition = "all 0.5s ease";
      el.style.opacity = 0;
    });
  });
}
