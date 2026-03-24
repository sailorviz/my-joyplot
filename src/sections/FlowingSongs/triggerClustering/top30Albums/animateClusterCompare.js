export function animateClusterCompare(containerRef, albumInfos, greatestAlbumInfos) {
  if (!containerRef?.current) return;

  const container = containerRef.current;
  const containerRect = container.getBoundingClientRect();
  const clusterEls = container.querySelectorAll(".clusterForAlbum");
  const tooltip = container.querySelector(".album-tooltip");

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scale = 0.3;

  console.log("albumInfos500 keys:", Object.keys(greatestAlbumInfos));
  // -------------------------
  // 1️⃣ 右侧 30 个 cluster 缩小并排列
  // -------------------------
  const rightClusters = Array.from(clusterEls); // 现有 30 个
  const rightCols = 6;
  const rightRows = Math.ceil(rightClusters.length / rightCols);
  const gapX = 60;
  const gapY = 60;
  const rightCenterX = viewportWidth * 0.75;
  const rightCenterY = viewportHeight / 2;

  rightClusters.forEach((cluster, i) => {
    const album = cluster.dataset.album;
    const rect = cluster.getBoundingClientRect();
    const col = i % rightCols;
    const row = Math.floor(i / rightCols);
    const targetX = rightCenterX + col * gapX - (rightCols / 2) * gapX;
    const targetY = rightCenterY + row * gapY - (rightRows / 2) * gapY;

    const comparingTx = targetX - rect.left;
    const comparingTy = targetY - rect.top;

    cluster.style.pointerEvents = "none";
    cluster.style.transition = "transform 1s ease, opacity 1s ease";
    cluster.style.transform = `translate(${comparingTx}px, ${comparingTy}px) scale(${scale})`;

    cluster.dataset.state = "comparing";
    cluster.dataset.comparingTx = comparingTx;
    cluster.dataset.comparingTy = comparingTy;

    // 更改hovering状态
    if (!cluster._handlers) cluster._handlers = {};
    
    // 🟩 初始（animateClusterWithImages）hover 处理器 - 命名函数并保存引用
    const comparingMouseEnter = (e) => {
      if (cluster.dataset.state !== "comparing") return; // 只在comparing状态生效
      
      const triggerScale = 0.5;
      cluster.style.transform = `translate(${comparingTx}px, ${comparingTy}px) scale(${triggerScale})`;
      
      if (cluster.classList.contains("band-highlight")){
        cluster.style.boxShadow = "0 0 4px #a0c4ff;";
      } else {
        cluster.style.boxShadow = "0 1px 2px rgba(0,0,0,0.3)";
      }
      
      const info = albumInfos[album];
      if (!info) return;

      tooltip.innerHTML = `
        <strong>《${album}》</strong><br/>
        <strong>Artists</strong>: ${info?.artist_name || "Unknown"}<br/>
        <strong>Year</strong>: ${info?.release_year || "Unknown"}<br/>
      `;

      tooltip.style.left = `${e.clientX - containerRect.left + 10}px`;
      tooltip.style.top = `${e.clientY - containerRect.top - 40}px`;
      tooltip.style.opacity = 1;
    };

    const comparingMouseMove = (e) => {
      tooltip.style.left = `${e.clientX - containerRect.left + 10}px`;
      tooltip.style.top = `${e.clientY - containerRect.top - 40}px`;
    };

    const comparingMouseLeave = () => {
      if (cluster.dataset.state !== "comparing") return;
      cluster.style.transform = `translate(${comparingTx}px, ${comparingTy}px) scale(${scale})`;
      
      if (cluster.classList.contains("band-highlight")){
        cluster.style.boxShadow = "0 0 4px #a0c4ff;";
      } else {
        cluster.style.boxShadow = "none";
      }
      
      tooltip.style.opacity = 0;
    };

    // 🟩 保存引用
    cluster._handlers.comparing = {
      mouseenter: comparingMouseEnter,
      mousemove: comparingMouseMove,
      mouseleave: comparingMouseLeave
    };

    cluster.style.pointerEvents = "auto";
    // 🟩 绑定初始 hover（首次创建或每次确保绑定）
    cluster.removeEventListener("mouseenter", comparingMouseEnter);
    cluster.removeEventListener("mousemove", comparingMouseMove);
    cluster.removeEventListener("mouseleave", comparingMouseLeave);
    cluster.addEventListener("mouseenter", comparingMouseEnter);
    cluster.addEventListener("mousemove", comparingMouseMove);
    cluster.addEventListener("mouseleave", comparingMouseLeave);  
  });

  // -------------------------
  // 2️⃣ 左侧生成 500 个新 cluster
  // -------------------------
  const newLeftClusters = [];
  const leftCount = 500;
  const leftCols = 25;
  const leftRows = Math.ceil(leftCount / leftCols);

  const leftGapX = 30;
  const leftGapY = 30;

  // 你想要的固定边距
  const offsetLeft = 30;
  const offsetTop = 50;
  const offsetBottom = 30;

  // 计算可用高度，确保不会超出底部
  const maxHeight = viewportHeight - offsetTop - offsetBottom;
  const gridHeightNeeded = leftRows * leftGapY;

  if (gridHeightNeeded > maxHeight) {
    console.warn("❗Grid overflows viewport height. Consider reducing gap or rows.");
  }

  // 直接用固定 offset 作为起点
  const startX = offsetLeft;
  const startY = offsetTop;

  for (let i = 0; i < leftCount; i++) {
    const cluster = document.createElement("div");
    cluster.className = "albums500Greatest";

    // 每个都有自己的 albumId
    const albumId = `${i + 1}`;
    cluster.dataset.id = albumId;

    cluster.style.width = "25px";
    cluster.style.height = "25px";
    cluster.style.position = "absolute";
    cluster.style.borderRadius = "2.4px";
    cluster.style.transformOrigin = "center center";
    cluster.style.opacity = 0;
    cluster.style.background = "orange";
    container.appendChild(cluster);
    newLeftClusters.push(cluster);

    const col = i % leftCols;
    const row = Math.floor(i / leftCols);

    const targetX = startX + col * leftGapX;
    const targetY = startY + row * leftGapY;

    cluster.style.left = `${targetX}px`;
    cluster.style.top = `${targetY}px`;
  }

  // 淡入动画
  requestAnimationFrame(() => {
    newLeftClusters.forEach(cluster => {
      cluster.style.transition = "opacity 0.8s ease";
      cluster.style.opacity = 1;

      //给每一个cluster加上hovering效果
      const albumId = cluster.dataset.id;
      
      // 绑定 hover 事件
      cluster.addEventListener("mouseenter", e => {
        const info = greatestAlbumInfos[albumId];
        if (!info) return;

        cluster.style.transform = "scale(1.3)";
        cluster.style.zIndex = 10000;

        tooltip.innerHTML = `
          <strong>《${info.album_name}》</strong><br/>
          <strong>Artist:</strong> ${info.artist_name}<br/>
          <strong>Year:</strong> ${info.release_year}
        `;

        // 定位 tooltip
        tooltip.style.opacity = 1;
        tooltip.style.left = `${e.clientX + containerRect.left + 10}px`;
        tooltip.style.top = `${e.clientY + containerRect.top - 40}px`;
      });

      cluster.addEventListener("mousemove", e => {
        tooltip.style.left = `${e.clientX + containerRect.left + 10}px`;
        tooltip.style.top = `${e.clientY + containerRect.top - 40}px`;
      });

      cluster.addEventListener("mouseleave", () => {
        cluster.style.transform = "scale(1)";
        cluster.style.zIndex = 1;
        tooltip.style.opacity = 0;
      });

      cluster.style.pointerEvents = "auto";
    });
  });
}
