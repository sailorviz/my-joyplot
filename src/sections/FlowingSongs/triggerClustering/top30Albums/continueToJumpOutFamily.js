export function continueToJumpOutFamily(containerRef, albumInfos){
// 重复语句很多，硬编码很多，后续有时间可以继续优化
  console.log("continueToJumpOutFamily is triggering...");
  // 获取元素
  const tooltip = containerRef.current.querySelector(".album-tooltip");
  const rectContainer = containerRef.current.getBoundingClientRect();

  const clusters = containerRef.current.querySelectorAll(".clusterForAlbum");
  const clusterElsArray = Array.from(clusters);
  const clustersOfTopArtists = [];
  clusterElsArray.forEach(cluster => {
    if( cluster.dataset.topArtist === "true" ){
      clustersOfTopArtists.push(cluster);
    } 
  });
  const clustersOfFaye = [];
  const clustersOfDouWei = [];
  const clustersOfDouLeah = [];
  const otherClusters = [];
  clustersOfTopArtists.forEach(cluster => {
    const mainArtist = cluster.dataset.mainArtist;
    if(mainArtist === "王菲Faye Wong"){
      clustersOfFaye.push(cluster);
    } else if (mainArtist === "窦唯Dou Wei"){
      clustersOfDouWei.push(cluster);
    } else if (mainArtist === "窦靖童Leah Dou"){
      clustersOfDouLeah.push(cluster);
    } else {
      otherClusters.push(cluster);
    }
  });

  // other clusters，调为黑白，降低明度，增加透明度
  otherClusters.forEach(el => {
    Object.assign(el.style, {
      transition: "filter 0.8s ease, opacity 0.8s ease",
      filter: "grayscale(100%)",
      opacity: 0.3,
      zIndex: 1,
      pointerEvents: "none" // 防止点击
    });
    const prevTx = parseFloat(el.dataset.jumpTx) || 0;
    const prevTy = parseFloat(el.dataset.jumpTy) || 0;
    el.dataset.jumpTxF = prevTx;
    el.dataset.jumpTyF = prevTy;
    el.dataset.state = "jumpF";
  });

  // clustersOfB 的cluster jump out，变大，仍可交互
  // 计算cluster jump to 的坐标
  clustersOfFaye.forEach(el => {
    const rect = el.getBoundingClientRect();

    const currentX = rect.left + rect.width / 2;
    const currentY = rect.top + rect.height / 2;
    
    // 在transform之前保存rect的值，我也不知道为什么...but it works...
    el.dataset.currentXF = currentX;
    el.dataset.currentYF = currentY;

    // —— 布局参数（你可以调） ——
    const baseX = window.innerWidth * 0.4;      // 最左侧起点
    const baseY = window.innerHeight * 0.35;    // 整行的中心高度

    // —— 新位置：横排 + 上下错开 ——
    const targetX = baseX;
    const targetY = baseY;

    // —— 计算 translate 所需的 dx, dy ——
    const cx = parseFloat(el.dataset.currentXF) || 0;
    const cy = parseFloat(el.dataset.currentYF) || 0;
    const dx = targetX - cx;
    const dy = targetY - cy;

    const prevTx = parseFloat(el.dataset.jumpTx) || 0;
    const prevTy = parseFloat(el.dataset.jumpTy) || 0;
    // const distanceY = -150;
    const ty = prevTy + dy;
    const tx = prevTx + dx;

    el.dataset.jumpTxF = tx;
    el.dataset.jumpTyF = ty;
    el.dataset.state = "jumpF";

    const album = el.dataset.album;
    const info = albumInfos[album];
    const mainArtist = info.main_artist;
    const img = el.querySelector("img");
    
    Object.assign(el.style, {
      pointerEvents: "none",
      transition: "transform 1s ease, z-index 0.5s",
      zIndex: 999, // 确保在最上层
      transform: `translate(${tx}px, ${ty}px) scale(0.7)`,
      maxWidth: "50vh"
    });

    // 🟩🟩🟩 动画结束 -> 切换成 artist photo
    const afterMove = () => {
      if (el.dataset.state === "jumpF") {
        img.src = el.dataset.artistPhoto;
      }
      el.removeEventListener("transitionend", afterMove);
    };
    el.addEventListener("transitionend", afterMove);

    if (!el._handlers) el._handlers = {};
    const jumpMouseEnterF =  (e) => {
      if (el.dataset.state !== "jumpF") return;
      el.style.transform = `translate(${tx}px, ${ty}px) scale(0.9)`;

      tooltip.innerHTML = `<strong>${mainArtist}</strong>`;
      tooltip.style.left = `${e.clientX - rectContainer.left + 10}px`;
      tooltip.style.top = `${e.clientY - rectContainer.top - 40}px`;
      tooltip.style.opacity = 1;
    };
    const jumpMouseMoveF = (e) => {
      tooltip.style.left = `${e.clientX - rectContainer.left + 10}px`;
      tooltip.style.top = `${e.clientY - rectContainer.top - 40}px`;
    };
    const jumpMouseLeaveF = () => {
      if (el.dataset.state !== "jumpF") return;
      el.style.transform = `translate(${tx}px, ${ty}px) scale(0.7)`;
      // img.src = el.dataset.albumCover;
      tooltip.style.opacity = 0;
    };

    el._handlers.jumpF = {
      mouseenter: jumpMouseEnterF,
      mousemove: jumpMouseMoveF,
      mouseleave: jumpMouseLeaveF
    };

    // 先移除（保险），再绑定
    el.removeEventListener("mouseenter", jumpMouseEnterF);
    el.removeEventListener("mousemove", jumpMouseMoveF);
    el.removeEventListener("mouseleave", jumpMouseLeaveF);
    el.addEventListener("mouseenter", jumpMouseEnterF);
    el.addEventListener("mousemove", jumpMouseMoveF);
    el.addEventListener("mouseleave", jumpMouseLeaveF);

    el.style.pointerEvents = "auto";
  });
  clustersOfDouWei.forEach(el => {
    const rect = el.getBoundingClientRect();

    const currentX = rect.left + rect.width / 2;
    const currentY = rect.top + rect.height / 2;
    
    // 在transform之前保存rect的值，我也不知道为什么...but it works...
    el.dataset.currentXF = currentX;
    el.dataset.currentYF = currentY;

    // —— 布局参数（你可以调） ——
    const baseX = window.innerWidth * 0.6;      // 最左侧起点
    const baseY = window.innerHeight * 0.35;    // 整行的中心高度

    // —— 新位置：横排 + 上下错开 ——
    const targetX = baseX;
    const targetY = baseY;

    // —— 计算 translate 所需的 dx, dy ——
    const cx = parseFloat(el.dataset.currentXF) || 0;
    const cy = parseFloat(el.dataset.currentYF) || 0;
    const dx = targetX - cx;
    const dy = targetY - cy;

    const prevTx = parseFloat(el.dataset.jumpTx) || 0;
    const prevTy = parseFloat(el.dataset.jumpTy) || 0;
    // const distanceY = -150;
    const ty = prevTy + dy;
    const tx = prevTx + dx;

    el.dataset.jumpTxF = tx;
    el.dataset.jumpTyF = ty;
    el.dataset.state = "jumpF";

    const album = el.dataset.album;
    const info = albumInfos[album];
    const mainArtist = info.main_artist;
    const img = el.querySelector("img");
    
    Object.assign(el.style, {
      pointerEvents: "none",
      transition: "transform 1s ease, z-index 0.5s",
      zIndex: 999, // 确保在最上层
      transform: `translate(${tx}px, ${ty}px) scale(0.7)`,
      maxWidth: "50vh"
    });

    // 🟩🟩🟩 动画结束 -> 切换成 artist photo
    const afterMove = () => {
      if (el.dataset.state === "jumpF") {
        img.src = el.dataset.artistPhoto;
      }
      el.removeEventListener("transitionend", afterMove);
    };
    el.addEventListener("transitionend", afterMove);

    if (!el._handlers) el._handlers = {};
    const jumpMouseEnterF =  (e) => {
      if (el.dataset.state !== "jumpF") return;
      el.style.transform = `translate(${tx}px, ${ty}px) scale(0.9)`;

      tooltip.innerHTML = `<strong>${mainArtist}</strong>`;
      tooltip.style.left = `${e.clientX - rectContainer.left + 10}px`;
      tooltip.style.top = `${e.clientY - rectContainer.top - 40}px`;
      tooltip.style.opacity = 1;
    };
    const jumpMouseMoveF = (e) => {
      tooltip.style.left = `${e.clientX - rectContainer.left + 10}px`;
      tooltip.style.top = `${e.clientY - rectContainer.top - 40}px`;
    };
    const jumpMouseLeaveF = () => {
      if (el.dataset.state !== "jumpF") return;
      el.style.transform = `translate(${tx}px, ${ty}px) scale(0.7)`;
      // img.src = el.dataset.albumCover;
      tooltip.style.opacity = 0;
    };

    el._handlers.jumpF = {
      mouseenter: jumpMouseEnterF,
      mousemove: jumpMouseMoveF,
      mouseleave: jumpMouseLeaveF
    };

    // 先移除（保险），再绑定
    el.removeEventListener("mouseenter", jumpMouseEnterF);
    el.removeEventListener("mousemove", jumpMouseMoveF);
    el.removeEventListener("mouseleave", jumpMouseLeaveF);
    el.addEventListener("mouseenter", jumpMouseEnterF);
    el.addEventListener("mousemove", jumpMouseMoveF);
    el.addEventListener("mouseleave", jumpMouseLeaveF);

    el.style.pointerEvents = "auto";
  });
  let finishCount = 0;
  clustersOfDouLeah.forEach((el, i) => {
    const rect = el.getBoundingClientRect();

    const currentX = rect.left + rect.width / 2;
    const currentY = rect.top + rect.height / 2;
    
    // 在transform之前保存rect的值，我也不知道为什么...but it works...
    el.dataset.currentXF = currentX;
    el.dataset.currentYF = currentY;

    // —— 布局参数（你可以调） ——
    const baseX = window.innerWidth * 0.44;      // 最左侧起点
    const baseY = window.innerHeight * 0.6;    // 整行的中心高度
    const colWidth = rect.width * 1.5;          // X 方向间距

    // —— 新位置：横排 + 上下错开 ——
    const targetX = baseX + i * colWidth;
    const targetY = baseY;

    // —— 计算 translate 所需的 dx, dy ——
    const cx = parseFloat(el.dataset.currentXF) || 0;
    const cy = parseFloat(el.dataset.currentYF) || 0;
    const dx = targetX - cx;
    const dy = targetY - cy;

    const prevTx = parseFloat(el.dataset.jumpTx) || 0;
    const prevTy = parseFloat(el.dataset.jumpTy) || 0;
    const ty = prevTy + dy;
    const tx = prevTx + dx;

    el.dataset.jumpTxF = tx;
    el.dataset.jumpTyF = ty;
    el.dataset.state = "jumpF";

    const album = el.dataset.album;
    const info = albumInfos[album];
    const mainArtist = info.main_artist;
    const img = el.querySelector("img");
    
    Object.assign(el.style, {
      pointerEvents: "none",
      transition: "transform 1s ease, z-index 0.5s",
      zIndex: 999, // 确保在最上层
      transform: `translate(${tx}px, ${ty}px) scale(0.7)`,
      maxWidth: "50vh"
    });

    // 🟩🟩🟩 动画结束 -> 切换成 artist photo
    const afterMove = () => {
      if (el.dataset.state === "jumpF") {
        img.src = el.dataset.artistPhoto;
      }
      finishCount += 1;
      el.removeEventListener("transitionend", afterMove);

      // 🔥 所有 clusters 都切换完后，执行合并动作
      if (finishCount === clustersOfDouLeah.length) {
        // mergeDouLeahClusters(clusters);
        const midX = window.innerWidth * 0.5;      // 最左侧起点
        const midY = baseY;   // 整行的中心高度

        clustersOfDouLeah.forEach(el => {
          const r = el.getBoundingClientRect();
          const midcx = r.left + r.width / 2;
          const midcy = r.top + r.height / 2;

          el.dataset.currentXFMid = midcx;
          el.dataset.currentYFMid = midcy;

          const midCx = parseFloat(el.dataset.currentXFMid) || 0;
          const midCy = parseFloat(el.dataset.currentYFMid) || 0;

          const moveX = midX - midCx;
          const moveY = midY - midCy;

          const jumpTxF = parseFloat(el.dataset.jumpTxF) || 0;
          const jumpTyF = parseFloat(el.dataset.jumpTyF) || 0;  

          const jumpTxFMid = jumpTxF + moveX;
          const jumpTyFMid = jumpTyF + moveY;

          // 合并动画（0.6 秒）
          Object.assign(el.style, {
            transition: "transform 0.6s ease",
            transform: `translate(${jumpTxFMid}px, ${jumpTyFMid}px) scale(0.7)`,
            zIndex: 999
          });
          
          if (!el._handlers) el._handlers = {};
          const jumpMouseEnterF =  (e) => {
            if (el.dataset.state !== "jumpF") return;
            el.style.transform = `translate(${jumpTxFMid}px, ${jumpTyFMid}px) scale(0.9)`;

            tooltip.innerHTML = `<strong>${mainArtist}</strong>`;
            tooltip.style.left = `${e.clientX - rectContainer.left + 10}px`;
            tooltip.style.top = `${e.clientY - rectContainer.top - 40}px`;
            tooltip.style.opacity = 1;
          };
          const jumpMouseMoveF = (e) => {
            tooltip.style.left = `${e.clientX - rectContainer.left + 10}px`;
            tooltip.style.top = `${e.clientY - rectContainer.top - 40}px`;
          };
          const jumpMouseLeaveF = () => {
            if (el.dataset.state !== "jumpF") return;
            el.style.transform = `translate(${jumpTxFMid}px, ${jumpTyFMid}px) scale(0.7)`;
            tooltip.style.opacity = 0;
          };

          el._handlers.jumpF = {
            mouseenter: jumpMouseEnterF,
            mousemove: jumpMouseMoveF,
            mouseleave: jumpMouseLeaveF
          };

          // 先移除（保险），再绑定
          el.removeEventListener("mouseenter", jumpMouseEnterF);
          el.removeEventListener("mousemove", jumpMouseMoveF);
          el.removeEventListener("mouseleave", jumpMouseLeaveF);
          el.addEventListener("mouseenter", jumpMouseEnterF);
          el.addEventListener("mousemove", jumpMouseMoveF);
          el.addEventListener("mouseleave", jumpMouseLeaveF);
          el.style.pointerEvents = "auto";
          })
        }
      };
    el.addEventListener("transitionend", afterMove);
  });
}