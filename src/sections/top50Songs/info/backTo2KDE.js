export function backTo2KDE(containerRef){
  // 显示 timeline SVG
  const oldTimeline = containerRef.current.querySelector(".songs-timeline");
  if (oldTimeline) oldTimeline.style.opacity = 1;
  const overlay = oldTimeline.querySelector(".popularity-kde-overlay");
  if (overlay) overlay.style.pointerEvents = "all";

  // 显示 timeline title&legend SVG
  const oldTitleLegend = containerRef.current.querySelector(".songs-titleLegend");
  if (oldTitleLegend) oldTitleLegend.style.opacity = 1;

  // 获取cluster元素, hide
  const clusterElsNodeList = containerRef.current.querySelectorAll(".top50-songs");
  const clusters = Array.from(clusterElsNodeList);
  clusters.forEach((el) => {
    el.style.opacity = 0;
    el.style.transition = "opacity 0.3s";
    el.style.pointerEvents = "none";
  });
}