import { registerHandlers } from "../../../components/registerHandlers";
import { switchHandlers } from "../../../components/switchHandlers";
import { updateLegend } from "../../../components/updateLegend";

export function dropSongsClustersToTimeline(containerRef, clusterElsArray, timelineSvg, titleLegendSvg, timelineOriginalP, songs, xScale, timelineHeight, offsetY, legend, language) {
  const timelineTranslateY = -70; // timeline 上升量 vh
  const durationY = 1500; // 下落动画时间 ms
  const durationX = 1500; // X 方向平移时间 ms
  const vh = window.innerHeight / 100;
  const timelineSvgYpx = (timelineOriginalP + timelineTranslateY) * vh; // timelineSVG顶部 Y px

  // ===== Step 1: clusters 下落 Y方向 =====
  const clusterDistanceYMap = {}; // ✅ 缓存每个 cluster 的 Y 位移
  clusterElsArray.forEach(cluster => {
    const rect = cluster.getBoundingClientRect();
    const clusterCenterY = rect.top + rect.height / 2; // 当前 Y 中心点
    const distanceY = timelineSvgYpx - clusterCenterY - offsetY - 20;
    const id = cluster.dataset.id;
    clusterDistanceYMap[id] = distanceY;

    cluster.style.transition = `transform ${durationY}ms cubic-bezier(0.25, 1, 0.5, 1)`;
    cluster.style.transform = `translateY(${distanceY}px) scale(0.3)`;
  });

  // timeline 上升
  const translateY = timelineTranslateY * vh - timelineHeight;
  timelineSvg
    .style("transition", `transform ${durationY}ms ease-out`)
    .style("transform", `translateY(${translateY}px)`);

  // ===== Step 2: clusters X方向移动 =====
  setTimeout(() => {
    clusterElsArray.forEach(cluster => {
      const rect = cluster.getBoundingClientRect();
      const clusterCenterX = rect.left + rect.width / 2;

      // X 方向目标
      const id = cluster.dataset.id; // id 是 每个songinfo的 index
      const releaseYear = songs[id].release_year;
      const releaseYearDate = new Date(releaseYear, 0, 1);
      const targetX = xScale(releaseYearDate);

      // cluster 当前中心 X 坐标相对于 container，计算 X 位移
      const containerLeft = cluster.offsetParent.getBoundingClientRect().left;
      const distanceX = targetX - (clusterCenterX - containerLeft);
      const distanceY = clusterDistanceYMap[id];

      cluster.dataset.tx = distanceX; // 🟦 缓存 transform
      cluster.dataset.ty = distanceY;

      cluster.style.transition = `transform ${durationX}ms cubic-bezier(0.25, 1, 0.5, 1)`;
      cluster.style.transform = `translate(${distanceX}px, ${distanceY}px) scale(0.3)`;

      cluster.dataset.state = "drop"; // 其他可能: "shrink", "drop", "focus"
    });   
  }, durationY);

   // ✅ 动画结束后重新启用交互 + tooltip
  setTimeout(() => {
    // 获取 tooltip
    const tooltip = containerRef.current.querySelector(".songs-tooltip");
    const rect = containerRef.current.getBoundingClientRect();

    const t = {
      zh: { year: '年份' },
      en: { year: 'Year' }
    }[language] || { year: 'Year' };

    clusterElsArray.forEach(cluster => {
      // 使用缓存 tx/ty（字符串记得 parseFloat）
      const tx = parseFloat(cluster.dataset.tx) || 0;
      const ty = parseFloat(cluster.dataset.ty) || 0;
      const id = cluster.dataset.id;
      const song = songs[id].song;
      const artist = songs[id].artist;
      const releaseYear = songs[id].release_year;

      // 清除旧事件监听
      cluster.onmouseenter = null;
      cluster.onmousemove = null;
      cluster.onmouseleave = null;

      if (!cluster._handlers) cluster._handlers = {};

      const dropMouseEnter = (e) => {
        if (cluster.dataset.state !== "drop") return;

        // 如果 compare 激活，则保持绿色，不改变背景颜色
        if (cluster.dataset.compareStatus) {
          cluster.style.background = "var(--color-secondary-darker)";
        } else {
          cluster.style.background = "var(--color-primary-darker)";
        }

        cluster.style.transform = `translate(${tx}px, ${ty}px) scale(0.35)`;
        tooltip.textContent = "";
        tooltip.innerHTML = `
          <strong>${song} - ${artist}</strong><br>
          ${t.year}: <span class="tooltip-value">${releaseYear}</span>
        `;
        // tooltip.style.left = `${e.clientX - rect.left + 10}px`;
        // tooltip.style.top = `${e.clientY - rect.top - 40}px`;
        // tooltip.style.opacity = 1;
        requestAnimationFrame(() => {
          const tooltipRect = tooltip.getBoundingClientRect();
          const tooltipWidth = tooltipRect.width;
          const tooltipHeight = tooltipRect.height;
          
          let left = e.clientX + 15;
          let top = e.clientY - 40;
          
          // 右边界检测
          if (left + tooltipWidth > window.innerWidth) {
            left = e.clientX - tooltipWidth - 15;
          }
          
          // 左边界检测
          if (left < 0) {
            left = 10;
          }
          
          // 上边界检测
          if (top < 0) {
            top = e.clientY + 20;
          }
          
          // 下边界检测
          if (top + tooltipHeight > window.innerHeight) {
            top = e.clientY - tooltipHeight - 10;
          }
          
          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${top}px`;
          tooltip.style.opacity = 1;
        });
      };
      const dropMouseMove = (e) => {
        // tooltip.style.left = `${e.clientX - rect.left + 10}px`;
        // tooltip.style.top = `${e.clientY - rect.top - 40}px`;
        requestAnimationFrame(() => {
          const tooltipRect = tooltip.getBoundingClientRect();
          const tooltipWidth = tooltipRect.width;
          const tooltipHeight = tooltipRect.height;
          
          let left = e.clientX + 15;
          let top = e.clientY - 40;
          
          // 右边界检测
          if (left + tooltipWidth > window.innerWidth) {
            left = e.clientX - tooltipWidth - 15;
          }
          
          // 左边界检测
          if (left < 0) {
            left = 10;
          }
          
          // 上边界检测
          if (top < 0) {
            top = e.clientY + 20;
          }
          
          // 下边界检测
          if (top + tooltipHeight > window.innerHeight) {
            top = e.clientY - tooltipHeight - 10;
          }
          
          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${top}px`;
          tooltip.style.opacity = 1;
        });
      };
      const dropMouseLeave = () => {
        if (cluster.dataset.state !== "drop") return;
        const tx = parseFloat(cluster.dataset.tx) || 0;
        const ty = parseFloat(cluster.dataset.ty) || 0;

        if (cluster.dataset.compareStatus) {
          // compare 激活：保持绿色 & 保持 scale 大小
          cluster.style.background = "var(--color-secondary-darker)";
          cluster.style.transform = `translate(${tx}px, ${ty}px) scale(0.3)`; 
        } else {
          // 默认逻辑
          cluster.style.background = "var(--color-primary-darker)";
          cluster.style.transform = `translate(${tx}px, ${ty}px) scale(0.3)`;
        }

        tooltip.style.opacity = 0;
      };

      // 保存引用
      registerHandlers(cluster, "drop", {
        mouseenter: dropMouseEnter,
        mousemove: dropMouseMove,
        mouseleave: dropMouseLeave
      });

      switchHandlers(cluster, "initial", "drop");
      cluster.style.pointerEvents = "auto"; // 🔓 允许交互
    });
  }, durationY + durationX);

  setTimeout(() => {
    titleLegendSvg.select(".title")
      .transition()
      .duration(500)
      .style("opacity", 1);

    updateLegend(legend, "songs", language);
  }, durationY + durationX + 500);
}

