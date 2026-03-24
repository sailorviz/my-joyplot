export function backToTimeline(containerRef){
  // cluster停止交互
  const clusters = containerRef.current.querySelectorAll(".clusterForArtist");
  const clustersArray = Array.from(clusters);
  clustersArray.forEach((cluster) =>{
    cluster.style.pointerEvents = "none";
  });

  // remove mapSVG
  const mapSvg = containerRef.current.querySelector(".map");
  mapSvg.style.opacity = 0;

  // 重新显示timeline, title, legend
  const timelineSvg = containerRef.current.querySelector(".timeline");
  const titleLegendSvg = containerRef.current.querySelector(".timelineTitle");

  timelineSvg.style.opacity = 1;
  titleLegendSvg.style.opacity = 1;

  // cluster回到原来的位置
  clustersArray.forEach((cluster) =>{
    // 回滚到上一步的位置
    const duration = 1500;
    const clusterTx = parseFloat(cluster.dataset.clusterTx) || 0;
    const clusterTy = parseFloat(cluster.dataset.clusterTy) || 0;
    cluster.style.transition = `transform ${duration}ms ease-out`;  // 取消动画，立即回到原位
    cluster.style.transform = `translate(${clusterTx}px,${clusterTy}px) scale(0.3)`;

    // 先解绑 mapping 事件
    if (cluster._handlers && cluster._handlers.mapping) {
      console.log("mapping exits");
      const h = cluster._handlers.mapping;
      cluster.removeEventListener("mouseenter", h.mouseenter);
      cluster.removeEventListener("mousemove", h.mousemove);
      cluster.removeEventListener("mouseleave", h.mouseleave);
      delete cluster._handlers.mapping;
    }

    // 再确保 cluster 原始事件引用存在
    if (cluster._handlers && cluster._handlers.cluster) {
      console.log("cluster exits");
      const hi = cluster._handlers.cluster;

      // 移除之前绑定，防止重复
      cluster.removeEventListener("mouseenter", hi.mouseenter);
      cluster.removeEventListener("mousemove", hi.mousemove);
      cluster.removeEventListener("mouseleave", hi.mouseleave);

      // 重新绑定
      cluster.addEventListener("mouseenter", hi.mouseenter);
      cluster.addEventListener("mousemove", hi.mousemove);
      cluster.addEventListener("mouseleave", hi.mouseleave);

      cluster.style.pointerEvents = "auto";
    } else {
      console.log("there is something wrong...");
    }
  })
}