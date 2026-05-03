
export function continueToJumpOutB(containerRef, albumInfos, language) {
  const t = {
    zh: { mainArtist: '主要音乐人', year: '年份' },
    en: { mainArtist: 'Main Artist', year: 'Year' }
  }[language] || { mainArtist: 'Main Artist', year: 'Year' };

  const clusters = containerRef.current.querySelectorAll(".clusterForAlbum");
  const clusterElsArray = Array.from(clusters);

  // 按 mainArtist 分组
  const groups = {};
  clusterElsArray.forEach(cluster => {
    if (cluster.dataset.topArtist !== "true") return;
    const artist = cluster.dataset.mainArtist;
    if (!groups[artist]) groups[artist] = [];
    groups[artist].push(cluster);
  });

  // 收集所有 TOP 艺术家和非 TOP 艺术家
  const clustersOfTopArtists = Object.values(groups).flat();
  const allClusterNames = Object.keys(groups);

  const ARTIST_CONFIGS = [
    {
      name: "Bruno Mars",
      baseX: 0.3,
      baseY: 0.2,
      colWidth: 2.5
    },
    {
      name: "袁娅维TIA RAY",
      baseX: 0.35,
      baseY: 0.45,
      colWidth: 2.5
    },
    {
      name: "窦靖童Leah Dou",
      baseX: 0.15,
      baseY: 0.7,
      colWidth: 2
    },
    {
      name: "Brian Culbertson",
      baseX: 0.45,
      baseY: 0.7,
      colWidth: 2
    },
    {
      name: "Dabeull",
      baseX: 0.75,
      baseY: 0.7,
      colWidth: 2
    }
  ];

  // 在定义 ARTIST_CONFIGS 之后
  const configuredArtistNames = ARTIST_CONFIGS.map(c => c.name);

  const otherClusters = clusterElsArray.filter(cluster => {
    // 属于 TOP 艺术家但在配置之外，或者根本不在 TOP 中
    const isTop = cluster.dataset.topArtist === "true";
    if (isTop && !configuredArtistNames.includes(cluster.dataset.mainArtist)) return true;
    if (!isTop) return true;
    return false;
  });

  function handleArtistClusters(clusters, artistConfig, albumInfos, containerRef, t) {
    const tooltip = containerRef.current.querySelector(".album-tooltip");
    const rectContainer = containerRef.current.getBoundingClientRect();

    clusters.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      const currentX = rect.left + rect.width / 2;
      const currentY = rect.top + rect.height / 2;

      el.dataset.currentXB = currentX;
      el.dataset.currentYB = currentY;

      const baseX = window.innerWidth * artistConfig.baseX;
      const baseY = window.innerHeight * artistConfig.baseY;
      const colWidth = rect.width * artistConfig.colWidth;

      const targetX = baseX + i * colWidth;
      const targetY = baseY;

      const cx = parseFloat(el.dataset.currentXB) || 0;
      const cy = parseFloat(el.dataset.currentYB) || 0;
      const dx = targetX - cx;
      const dy = targetY - cy;

      const prevTx = parseFloat(el.dataset.jumpTx) || 0;
      const prevTy = parseFloat(el.dataset.jumpTy) || 0;
      const tx = prevTx + dx;
      const ty = prevTy + dy;

      el.dataset.jumpTxB = tx;
      el.dataset.jumpTyB = ty;
      el.dataset.state = "jumpB";

      const album = el.dataset.album;
      const info = albumInfos[album];
      const releaseYear = info?.release_year;
      const mainArtist = info?.main_artist;
      const img = el.querySelector("img");

      Object.assign(el.style, {
        transition: "transform 1s ease, z-index 0.5s",
        zIndex: 999,
        transform: `translate(${tx}px, ${ty}px) scale(0.7)`,
        maxWidth: "50vh"
      });

      // --- 事件处理 ---
      if (!el._handlers) el._handlers = {};

      const jumpMouseEnterB = (e) => {
        if (el.dataset.state !== "jumpB") return;
        el.style.transform = `translate(${tx}px, ${ty}px) scale(0.9)`;
        img.src = el.dataset.artistPhoto;
        tooltip.innerHTML = `<strong>${album}</strong><br>
        ${t.mainArtist}: <span class="tooltip-value">${mainArtist}</span><br>
        ${t.year}: <span class="tooltip-value">${releaseYear}</span>`;
        // tooltip.style.left = `${e.clientX - rectContainer.left + 10}px`;
        // tooltip.style.top = `${e.clientY - rectContainer.top - 40}px`;
        // tooltip.style.opacity = 1;
        requestAnimationFrame(() => {
          const tooltipRect = tooltip.getBoundingClientRect();
          const tooltipWidth = tooltipRect.width;
          const tooltipHeight = tooltipRect.height;
          
          let left = e.clientX + 15;
          let top = e.clientY - 40;
          
          // 右边界检测
          if (left + tooltipWidth > window.innerWidth) {
            left = e.clientX - tooltipWidth - 15;
          }
          
          // 左边界检测
          if (left < 0) {
            left = 10;
          }
          
          // 上边界检测
          if (top < 0) {
            top = e.clientY + 20;
          }
          
          // 下边界检测
          if (top + tooltipHeight > window.innerHeight) {
            top = e.clientY - tooltipHeight - 10;
          }
          
          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${top}px`;
          tooltip.style.opacity = 1;
        });
      };

      const jumpMouseMoveB = (e) => {
        // tooltip.style.left = `${e.clientX - rectContainer.left + 10}px`;
        // tooltip.style.top = `${e.clientY - rectContainer.top - 40}px`;
        requestAnimationFrame(() => {
          const tooltipRect = tooltip.getBoundingClientRect();
          const tooltipWidth = tooltipRect.width;
          const tooltipHeight = tooltipRect.height;
          
          let left = e.clientX + 15;
          let top = e.clientY - 40;
          
          // 右边界检测
          if (left + tooltipWidth > window.innerWidth) {
            left = e.clientX - tooltipWidth - 15;
          }
          
          // 左边界检测
          if (left < 0) {
            left = 10;
          }
          
          // 上边界检测
          if (top < 0) {
            top = e.clientY + 20;
          }
          
          // 下边界检测
          if (top + tooltipHeight > window.innerHeight) {
            top = e.clientY - tooltipHeight - 10;
          }
          
          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${top}px`;
          tooltip.style.opacity = 1;
        });
      };

      const jumpMouseLeaveB = () => {
        if (el.dataset.state !== "jumpB") return;
        el.style.transform = `translate(${tx}px, ${ty}px) scale(0.7)`;
        img.src = el.dataset.albumCover;
        tooltip.style.opacity = 0;
      };

      el._handlers.jumpB = {
        mouseenter: jumpMouseEnterB,
        mousemove: jumpMouseMoveB,
        mouseleave: jumpMouseLeaveB
      };

      el.removeEventListener("mouseenter", jumpMouseEnterB);
      el.removeEventListener("mousemove", jumpMouseMoveB);
      el.removeEventListener("mouseleave", jumpMouseLeaveB);
      el.addEventListener("mouseenter", jumpMouseEnterB);
      el.addEventListener("mousemove", jumpMouseMoveB);
      el.addEventListener("mouseleave", jumpMouseLeaveB);
    });
  }

  // 处理 other clusters（统一灰色、不可交互）
  otherClusters.forEach(el => {
    Object.assign(el.style, {
      transition: "filter 0.8s ease, opacity 0.8s ease",
      filter: "grayscale(100%)",
      opacity: 0.3,
      zIndex: 1,
      pointerEvents: "none"
    });
    el.dataset.jumpTxB = parseFloat(el.dataset.jumpTx) || 0;
    el.dataset.jumpTyB = parseFloat(el.dataset.jumpTy) || 0;
    el.dataset.state = "jumpB";
  });

  // 遍历配置，只处理匹配的艺术家
  ARTIST_CONFIGS.forEach(config => {
    if (groups[config.name]) {
      handleArtistClusters(groups[config.name], config, albumInfos, containerRef, t);
    }
  });
}