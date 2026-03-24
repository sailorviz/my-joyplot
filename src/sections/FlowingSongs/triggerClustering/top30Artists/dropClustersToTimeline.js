import * as d3 from "d3";

export function dropClustersToTimeline(containerRef, clusterElsMap, timelineSvg, titleLegendSvg, timelineOriginalP, artistInfos, xScale, timelineHeight, offsetY) {
  const timelineTranslateY = -70; // timeline 上升量 vh
  const durationY = 1500; // 下落动画时间 ms
  const durationX = 1500; // X 方向平移时间 ms
  const vh = window.innerHeight / 100;
  const timelineSvgYpx = (timelineOriginalP + timelineTranslateY) * vh; // timelineSVG顶部 Y px

  // ===== Step 1: clusters 下落 Y方向 =====
  const clusterDistanceYMap = {}; // ✅ 缓存每个 cluster 的 Y 位移
  Object.entries(clusterElsMap).forEach(([artist, cluster]) => {
    const rect = cluster.getBoundingClientRect();
    const clusterCenterY = rect.top + rect.height / 2; // 当前 Y 中心点
    const distanceY = timelineSvgYpx - clusterCenterY - offsetY - 35;
    clusterDistanceYMap[artist] = distanceY;

    cluster.dataset.state = "drop"; // 🟦 进入 drop 状态

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
    Object.entries(clusterElsMap).forEach(([artist, cluster]) => {
      const rect = cluster.getBoundingClientRect();
      const clusterCenterX = rect.left + rect.width / 2;

      // ✅ 使用缓存的 Y 位移，而不是重新计算
      const distanceY = clusterDistanceYMap[artist] || 0;

      // X 方向目标
      const debutYear = artistInfos[artist].debut_year;
      const debutYearDate = new Date(debutYear, 0, 1);
      const targetX = xScale(debutYearDate);

      // cluster 当前中心 X 坐标相对于 container，计算 X 位移
      const containerLeft = cluster.offsetParent.getBoundingClientRect().left;
      const distanceX = targetX - (clusterCenterX - containerLeft);

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
    const tooltip = containerRef.current.querySelector(".artist-tooltip");
    const rect = containerRef.current.getBoundingClientRect();

    Object.entries(clusterElsMap).forEach(([artist, cluster]) => {
      const debutYear = artistInfos[artist].debut_year;
      const tx = cluster.dataset.tx || 0;
      const ty = cluster.dataset.ty || 0;
      cluster.style.pointerEvents = "auto"; // 🔓 允许交互

      // 清除旧事件监听
      cluster.onmouseenter = null;
      cluster.onmousemove = null;
      cluster.onmouseleave = null;

      if (!cluster._handlers) cluster._handlers = {};

      const dropMouseEnter = (e) => {
        // 使用缓存 tx/ty（字符串记得 parseFloat）
        const tx = parseFloat(cluster.dataset.tx) || 0;
        const ty = parseFloat(cluster.dataset.ty) || 0;
        cluster.style.transform = `translate(${tx}px, ${ty}px) scale(0.35)`;
        // tooltip.innerText = `${artist}\nDebut: ${debutYear}`;
        tooltip.innerHTML = `<strong>${artist}</strong><br>Debut: ${debutYear}`;
        tooltip.style.left = `${e.clientX - rect.left + 10}px`;
        tooltip.style.top = `${e.clientY - rect.top - 40}px`;
        tooltip.style.opacity = 1;
      };
      const dropMouseMove = (e) => {
        tooltip.style.left = `${e.clientX - rect.left + 10}px`;
        tooltip.style.top = `${e.clientY - rect.top - 40}px`;
      };
      const dropMouseLeave = () => {
        const tx = parseFloat(cluster.dataset.tx) || 0;
        const ty = parseFloat(cluster.dataset.ty) || 0;
        cluster.style.transform = `translate(${tx}px, ${ty}px) scale(0.3)`;
        tooltip.style.opacity = 0;
      };

      // 保存引用
      cluster._handlers.drop = {
        mouseenter: dropMouseEnter,
        mousemove: dropMouseMove,
        mouseleave: dropMouseLeave
      };

      // 先移除（保险），再绑定
      cluster.removeEventListener("mouseenter", dropMouseEnter);
      cluster.removeEventListener("mousemove", dropMouseMove);
      cluster.removeEventListener("mouseleave", dropMouseLeave);
      cluster.addEventListener("mouseenter", dropMouseEnter);
      cluster.addEventListener("mousemove", dropMouseMove);
      cluster.addEventListener("mouseleave", dropMouseLeave);
    });
  }, durationY + durationX);

  setTimeout(() => {
    titleLegendSvg.select(".title")
      .transition()
      .duration(500)
      .style("opacity", 1);

    titleLegendSvg.select(".legend")
      .transition()
      .duration(500)
      .style("opacity", 1);
  }, durationY + durationX + 500);
}

