export function cancelFocusClusterOfAlbum(container) {
  const clusterEls = container.querySelectorAll(".clusterForAlbum");
  clusterEls.forEach(el => {
    delete el.dataset.focused; // 移除聚焦标记
    Object.assign(el.style, {
      transform: "scale(1) translate(0,0)",
      filter: "none",
      opacity: "1",
      zIndex: "1",
      pointerEvents: "auto"
    });
  });
  const infoDiv = container.querySelector(".album-info");
  if (infoDiv) infoDiv.remove();
}
