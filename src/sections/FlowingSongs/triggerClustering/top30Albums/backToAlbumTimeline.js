export function backToAlbumTimeline(containerRef, albumInfos){
  // 获取元素
  const albumTimeline = containerRef.current.querySelector(".albumTimeline");
  const albumTitleLegend = containerRef.current.querySelector(".albumTitleLegend");

  const clusters = containerRef.current.querySelectorAll(".clusterForAlbum");
  const clusterElsArray = Array.from(clusters);
  const clustersOfTopArtists = [];
  const otherClusters = [];
  clusterElsArray.forEach(cluster => {
    const album = cluster.dataset.album;
    const info = albumInfos[album];
    if(info.if_top30artists === 1){
      clustersOfTopArtists.push(cluster);
      cluster.dataset.topArtist = "true";
    } else {
      otherClusters.push(cluster);
      cluster.dataset.topArtist = "false";
    }
  });

  // timeline, titleLegend, otherClusters 恢复 opacity
  Object.assign(albumTimeline.style, {
    transition: "filter 0.8s ease, opacity 0.8s ease",
    filter: "none",
    opacity: 1,
    pointerEvents: "auto"
  });
  Object.assign(albumTitleLegend.style, {
    transition: "filter 0.8s ease, opacity 0.8s ease",
    filter: "none",
    opacity: 1,
    pointerEvents: "auto" // 防止点击
  });
  otherClusters.forEach(el => {
    Object.assign(el.style, {
      transition: "filter 0.8s ease, opacity 0.8s ease",
      filter: "none",
      opacity: 1,
      pointerEvents: "auto" // 防止点击
    });
    el.dataset.state = "cluster";
  });

  // clusterOfTopArtist 回到原位，交互恢复
  clustersOfTopArtists.forEach(el => {
    const prevTx = parseFloat(el.dataset.clusterTx) || 0;
    const prevTy = parseFloat(el.dataset.clusterTy) || 0;
    el.dataset.state = "cluster";
    
    Object.assign(el.style, {
      transition: "transform 1s ease, z-index 0.5s",
      zIndex: 1, // 确保在最上层
      transform: `translate(${prevTx}px, ${prevTy}px) scale(0.3)`,
      maxWidth: "50vh"
    });

    const h = el._handlers.cluster;
    const prevH = el._handlers.jump;

    // 先移除（保险），再绑定
    el.removeEventListener("mouseenter", prevH.mouseenter);
    el.removeEventListener("mousemove", prevH.mousemove);
    el.removeEventListener("mouseleave", prevH.mouseleave);
    el.addEventListener("mouseenter", h.mouseenter);
    el.addEventListener("mousemove", h.mousemove);
    el.addEventListener("mouseleave", h.mouseleave);
  });  
}