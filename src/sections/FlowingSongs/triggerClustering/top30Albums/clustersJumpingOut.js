export function clustersJumpingOut(containerRef, albumInfos){
  // 获取元素
  const albumTimeline = containerRef.current.querySelector(".albumTimeline");
  const albumTitleLegend = containerRef.current.querySelector(".albumTitleLegend");
  const tooltip = containerRef.current.querySelector(".album-tooltip");
  const rectContainer = containerRef.current.getBoundingClientRect();

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

  // timelinesvg, titlelegendsvg, 及if_top30artists为0的clusters，调为黑白，降低明度，增加透明度
  Object.assign(albumTimeline.style, {
    transition: "filter 0.8s ease, opacity 0.8s ease",
    filter: "grayscale(100%)",
    opacity: 0.3,
    pointerEvents: "none" // 防止点击
  });
  Object.assign(albumTitleLegend.style, {
    transition: "filter 0.8s ease, opacity 0.8s ease",
    filter: "grayscale(100%)",
    opacity: 0.3,
    pointerEvents: "none" // 防止点击
  });
  otherClusters.forEach(el => {
    Object.assign(el.style, {
      transition: "filter 0.8s ease, opacity 0.8s ease",
      filter: "grayscale(100%)",
      opacity: 0.3,
      pointerEvents: "none" // 防止点击
    });
    const prevTx = parseFloat(el.dataset.clusterTx) || 0;
    const prevTy = parseFloat(el.dataset.clusterTy) || 0;
    el.dataset.jumpTx = prevTx;
    el.dataset.jumpTy = prevTy;
    el.dataset.state = "jump";
  });

  // if_top30artists为1的cluster jump out，变大，仍可交互
    // 计算cluster jump to 的坐标
  clustersOfTopArtists.forEach((el, i) => {
    const rect = el.getBoundingClientRect();

    const currentX = rect.left + rect.width / 2;
    const currentY = rect.top + rect.height / 2;
    
    // 在transform之前保存rect的值，我也不知道为什么...but it works...
    el.dataset.currentX = currentX;
    el.dataset.currentY = currentY;

    // —— 布局参数（你可以调） ——
    const baseX = window.innerWidth * 0.1;      // 最左侧起点
    const baseY = window.innerHeight * 0.45;    // 整行的中心高度
    const colWidth = rect.width * 1;          // X 方向间距
    const offsetY = rect.height * 0.7;          // 上下错开量

    // —— 新位置：横排 + 上下错开 ——
    const targetX = baseX + i * colWidth;
    const targetY = baseY + (i % 2 === 0 ? -offsetY : offsetY);

    // —— 计算 translate 所需的 dx, dy ——
    const cx = parseFloat(el.dataset.currentX) || 0;
    const cy = parseFloat(el.dataset.currentY) || 0;
    const dx = targetX - cx;
    const dy = targetY - cy;

    const prevTx = parseFloat(el.dataset.clusterTx) || 0;
    const prevTy = parseFloat(el.dataset.clusterTy) || 0;
    // const distanceY = -150;
    const ty = prevTy + dy;
    const tx = prevTx + dx;

    el.dataset.jumpTx = tx;
    el.dataset.jumpTy = ty;
    el.dataset.state = "jump";

    const album = el.dataset.album;
    const info = albumInfos[album];
    const releaseYear = info.release_year;
    const mainArtist = info.main_artist;
    const img = el.querySelector("img");
    
    Object.assign(el.style, {
      transition: "transform 1s ease, z-index 0.5s",
      zIndex: 999, // 确保在最上层
      transform: `translate(${tx}px, ${ty}px) scale(0.5)`,
      maxWidth: "50vh"
    });

    if (!el._handlers) el._handlers = {};
    const jumpMouseEnter =  (e) => {
      if (el.dataset.state !== "jump") return;
      el.style.transform = `translate(${tx}px, ${ty}px) scale(0.7)`;
      // 切换图片为 artist photo
      
      img.src = el.dataset.artistPhoto;

      tooltip.innerHTML = `<strong>${album}</strong><br>Main Artist: ${mainArtist}<br>Year: ${releaseYear}`;
      tooltip.style.left = `${e.clientX - rectContainer.left + 10}px`;
      tooltip.style.top = `${e.clientY - rectContainer.top - 40}px`;
      tooltip.style.opacity = 1;
    };
    const jumpMouseMove = (e) => {
      tooltip.style.left = `${e.clientX - rectContainer.left + 10}px`;
      tooltip.style.top = `${e.clientY - rectContainer.top - 40}px`;
    };
    const jumpMouseLeave = () => {
      if (el.dataset.state !== "jump") return;
      el.style.transform = `translate(${tx}px, ${ty}px) scale(0.5)`;
      // 切换图片为 album cover
      img.src = el.dataset.albumCover;
      tooltip.style.opacity = 0;
    };

    el._handlers.jump = {
      mouseenter: jumpMouseEnter,
      mousemove: jumpMouseMove,
      mouseleave: jumpMouseLeave
    };

    // 先移除（保险），再绑定
    el.removeEventListener("mouseenter", jumpMouseEnter);
    el.removeEventListener("mousemove", jumpMouseMove);
    el.removeEventListener("mouseleave", jumpMouseLeave);
    el.addEventListener("mouseenter", jumpMouseEnter);
    el.addEventListener("mousemove", jumpMouseMove);
    el.addEventListener("mouseleave", jumpMouseLeave);
  });
}