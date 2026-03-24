export function cancelHighlightBands(container) {
  const clusterEls = container.querySelectorAll(".band-highlight");
  clusterEls.forEach(el => {
    el.classList.remove("band-highlight");
  });

  // 处理 500 clusters
  const newLeftClusters = container.querySelectorAll(".albums500Greatest");
  if (newLeftClusters.length === 0) return;
  
  newLeftClusters.forEach(el => {
    el.style.opacity = 1;
    el.style.pointerEvents = "auto";
  });
}
