export function backToInitialJumping(containerRef){
// 重复语句很多，硬编码很多，后续有时间可以继续优化
  console.log("backToInitialJumping is triggering");
  const clusters = containerRef.current.querySelectorAll(".clusterForAlbum");
  const clusterElsArray = Array.from(clusters);
  const clustersOfTopArtists = [];
  const otherClusters = [];
  clusterElsArray.forEach(cluster => {
    if( cluster.dataset.topArtist === "true" ){
      clustersOfTopArtists.push(cluster);
    } 
  });

  clustersOfTopArtists.forEach(cluster => {
    const mainArtist = cluster.dataset.mainArtist;
    if(mainArtist !== "Bruno Mars" && "袁娅维TIA RAY" && "窦靖童Leah Dou" && "Brian Culbertson" && "Dabeull" ){
      otherClusters.push(cluster);
    }
  });

  otherClusters.forEach(el => {
    Object.assign(el.style, {
      transition: "filter 0.8s ease, opacity 0.8s ease",
      filter: "none",
      opacity: 1,
      pointerEvents: "auto"
    });
    el.dataset.state = "jump";
  });

  clustersOfTopArtists.forEach(el => {
    const prevTx = parseFloat(el.dataset.jumpTx) || 0;
    const prevTy = parseFloat(el.dataset.jumpTy) || 0;
    el.dataset.state = "jump";
    
    Object.assign(el.style, {
      transition: "transform 1s ease, z-index 0.5s",
      zIndex: 999, // 确保在最上层
      transform: `translate(${prevTx}px, ${prevTy}px) scale(0.5)`,
      maxWidth: "50vh"
    });

    const h = el._handlers.jump;
    // 先移除（保险），再绑定
    el.removeEventListener("mouseenter", h.mouseenter);
    el.removeEventListener("mousemove", h.mousemove);
    el.removeEventListener("mouseleave", h.mouseleave);
    el.addEventListener("mouseenter", h.mouseenter);
    el.addEventListener("mousemove", h.mousemove);
    el.addEventListener("mouseleave", h.mouseleave);
  });
}