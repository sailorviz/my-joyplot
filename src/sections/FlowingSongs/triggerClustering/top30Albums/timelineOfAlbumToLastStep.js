export function timelineOfAlbumToLastStep(containerRef) {
  console.log("timelineOfAlbumToLastStep is triggering...")

  const clusterElsNodeList = containerRef.current.querySelectorAll(".clusterForAlbum");
  const clusters = Array.from(clusterElsNodeList);

  clusters.forEach((clusterEl) => {
    // 🟩 1) 如果存在 drop 阶段的 handlers，先移除它们
    if (clusterEl._handlers && clusterEl._handlers.drop) {
      const h = clusterEl._handlers.drop;
      clusterEl.removeEventListener("mouseenter", h.mouseenter);
      clusterEl.removeEventListener("mousemove", h.mousemove);
      clusterEl.removeEventListener("mouseleave", h.mouseleave);
      delete clusterEl._handlers.drop;
    }

    const tx = parseFloat(clusterEl.dataset.comparingTx) || 0;
    const ty = parseFloat(clusterEl.dataset.comparingTy) || 0;
    
    clusterEl.style.transition = "transform 1s ease";
    clusterEl.style.transform =  `translate(${tx}px,${ty}px) scale(0.3)`;

    clusterEl.dataset.state = "comparing";

    // 🟩 重新绑定初始 hover（使用保存的 handler 引用）
    if (clusterEl._handlers && clusterEl._handlers.comparing) {
      const hi = clusterEl._handlers.comparing;
      clusterEl.removeEventListener("mouseenter", hi.mouseenter);
      clusterEl.removeEventListener("mousemove", hi.mousemove);
      clusterEl.removeEventListener("mouseleave", hi.mouseleave);
      clusterEl.addEventListener("mouseenter", hi.mouseenter);
      clusterEl.addEventListener("mousemove", hi.mousemove);
      clusterEl.addEventListener("mouseleave", hi.mouseleave);
    } else {
      // 如果初始 handler 丢失，你可以按 animateClusterWithImages 中的逻辑重新创建绑定
      // （略，可按之前示例复制）
    }
  });

  // 移除 timeline SVG
  const oldTimeline = containerRef.current.querySelector(".albumTimeline");
  if (oldTimeline) oldTimeline.remove();
  // 移除 timeline title&legend SVG
  const oldTitleLegend = containerRef.current.querySelector(".albumTitleLegend");
  if (oldTitleLegend) oldTitleLegend.remove();
}