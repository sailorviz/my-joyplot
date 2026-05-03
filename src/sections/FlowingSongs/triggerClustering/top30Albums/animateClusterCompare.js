export function animateClusterCompare(containerRef, albumInfos, greatestAlbumInfos, language) {
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
  const tooltipTexts = {
    zh: {
      artists: '艺人',
      year: '年份',
    },
    en: {
      artists: 'Artists',
      year: 'Year',
    }
  };
  const t = tooltipTexts[language] || tooltipTexts.en;

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
        <strong>${album}</strong><br/>
        ${t.artists}: <span class="tooltip-value">${info?.artist_name || "Unknown"}</span><br/>
        ${t.year}: <span class="tooltip-value">${info?.release_year || "Unknown"}</span><br/>
      `;

      // tooltip.style.left = `${e.clientX - containerRect.left + 10}px`;
      // tooltip.style.top = `${e.clientY - containerRect.top - 40}px`;
      tooltip.style.opacity = 1;
    };

    const comparingMouseMove = (e) => {
      // tooltip.style.left = `${e.clientX - containerRect.left + 10}px`;
      // tooltip.style.top = `${e.clientY - containerRect.top - 40}px`;
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

    // 🟢 根据年份设置颜色
    const albumInfo = greatestAlbumInfos[albumId];
    const releaseYear = albumInfo?.release_year;

    if (releaseYear && releaseYear < 2000) {
      cluster.style.background = "#af56d8";  // 黄绿色（辅色）
    } else {
      cluster.style.background =  "#b7e066";
    }

    cluster.style.width = "25px";
    cluster.style.height = "25px";
    cluster.style.position = "absolute";
    cluster.style.borderRadius = "2.4px";
    cluster.style.transformOrigin = "center center";
    cluster.style.opacity = 0;
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

        tooltip.innerHTML = `
          <strong>${info.album_name}</strong><br/>
          ${t.artists}: <span class="tooltip-value">${info.artist_name}</span><br/>
          ${t.year}: <span class="tooltip-value">${info.release_year}</span>
        `;

        // 定位 tooltip
        tooltip.style.opacity = 1;
        // tooltip.style.left = `${e.clientX + containerRect.left + 10}px`;
        // tooltip.style.top = `${e.clientY + containerRect.top - 40}px`;
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
      });

      cluster.addEventListener("mousemove", e => {
        // tooltip.style.left = `${e.clientX + containerRect.left + 10}px`;
        // tooltip.style.top = `${e.clientY + containerRect.top - 40}px`;
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
      });

      cluster.addEventListener("mouseleave", () => {
        cluster.style.transform = "scale(1)";
        tooltip.style.opacity = 0;
      });

      cluster.style.pointerEvents = "auto";
    });
  });
}

// export function animateClusterCompare(containerRef, albumInfos, greatestAlbumInfos, language) {
//   if (!containerRef?.current) return;

//   const container = containerRef.current;
//   const tooltip = container.querySelector(".album-tooltip");
//   const clusterEls = container.querySelectorAll(".clusterForAlbum");
  
//   // 存储左侧 clusters 的引用
//   let leftClusters = [];
  
//   // 当前布局参数
//   let currentLayout = null;
  
//   const tooltipTexts = {
//     zh: { artists: '艺人', year: '年份' },
//     en: { artists: 'Artists', year: 'Year' }
//   };
//   const t = tooltipTexts[language] || tooltipTexts.en;

//   // ==================== 动态计算布局函数 ====================
//   function calculateResponsiveLayout(viewportWidth, viewportHeight) {
//     // 左右分界：右侧从视口宽度的 55% 开始（左侧占 55%，右侧占 45%）
//     const rightStartX = viewportWidth * 0.7;
//     const leftMaxWidth = viewportWidth * 0.65; // 左侧最大宽度
    
//     // ===== 右侧配置（30个专辑）=====
//     const rightCount = 30;
//     const rightCols = 6;
//     const rightRows = Math.ceil(rightCount / rightCols);
//     // 动态间距：视口宽度的 3%，最小 35px，最大 70px
//     const rightGapX = 8;
//     const rightGapY = 8;
//     // 动态缩放：0.2-0.35 之间
//     const rightScale = Math.min(0.35, Math.max(0.2, viewportWidth / 3500));
//     const rightCenterY = viewportHeight / 2;
    
//     // ===== 左侧配置（500个专辑）=====
//     const leftCount = 500;
//     // 动态列数：根据左侧可用宽度计算
//     const leftCols = Math.floor(leftMaxWidth / 32);
//     const leftRows = Math.ceil(leftCount / leftCols);
//     // 动态间距：视口宽度的 1.5%，最小 20px，最大 35px
//     const leftGapX = 8;
//     const leftGapY = 8;
//     // 动态尺寸：视口宽度的 1/50，最小 18px，最大 28px
//     const leftSize = Math.min(28, Math.max(18, viewportWidth / 55));
//     // 起始位置
//     const leftStartX = 20;
//     const leftStartY = 50;
    
//     // 检查是否溢出
//     const gridHeight = leftRows * leftGapY;
//     const maxHeight = viewportHeight - 80;
//     if (gridHeight > maxHeight) {
//       console.warn(`⚠️ Grid height (${gridHeight}px) exceeds viewport (${maxHeight}px)`);
//     }
    
//     return {
//       right: {
//         cols: rightCols,
//         rows: rightRows,
//         gapX: rightGapX,
//         gapY: rightGapY,
//         scale: rightScale,
//         startX: rightStartX,
//         centerY: rightCenterY
//       },
//       left: {
//         count: leftCount,
//         cols: leftCols,
//         rows: leftRows,
//         gapX: leftGapX,
//         gapY: leftGapY,
//         size: leftSize,
//         startX: leftStartX,
//         startY: leftStartY
//       }
//     };
//   }
  
//   // ==================== 更新右侧 clusters 位置 ====================
//   function updateRightClusters(layout) {
//     const rightClusters = Array.from(clusterEls);
//     const { cols, gapX, gapY, scale, startX, centerY } = layout.right;
//     const rows = layout.right.rows;
    
//     rightClusters.forEach((cluster, i) => {
//       const album = cluster.dataset.album;
//       const rect = cluster.getBoundingClientRect();
//       const col = i % cols;
//       const row = Math.floor(i / cols);
      
//       // 计算目标位置（网格居中）
//       const gridWidth = cols * gapX;
//       const gridHeight = rows * gapY;
//       const targetX = startX + col * gapX - gridWidth / 2 + gapX / 2;
//       const targetY = centerY + row * gapY - gridHeight / 2 + gapY / 2;
      
//       const translateX = targetX - rect.left;
//       const translateY = targetY - rect.top;
      
//       cluster.style.transition = "transform 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1)";
//       cluster.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      
//       cluster.dataset.state = "comparing";
//       cluster.dataset.comparingTx = translateX;
//       cluster.dataset.comparingTy = translateY;
//       cluster.dataset.targetScale = scale;
      
//       // 绑定 hover 事件（如果还没绑定）
//       bindRightClusterEvents(cluster, albumInfos, album, scale, tooltip, t);
//     });
//   }
  
//   // ==================== 绑定右侧 cluster 事件 ====================
//   function bindRightClusterEvents(cluster, albumInfos, album, baseScale, tooltip, t) {
//     if (cluster._eventsBound) return;
    
//     const translateX = parseFloat(cluster.dataset.comparingTx);
//     const translateY = parseFloat(cluster.dataset.comparingTy);
//     const scale = baseScale;
    
//     const mouseEnter = (e) => {
//       if (cluster.dataset.state !== "comparing") return;
      
//       const triggerScale = Math.min(0.7, scale * 1.5);
//       cluster.style.transform = `translate(${translateX}px, ${translateY}px) scale(${triggerScale})`;
//       cluster.style.zIndex = "100";
      
//       const info = albumInfos[album];
//       if (info) {
//         tooltip.innerHTML = `
//           <strong>${album}</strong><br/>
//           ${t.artists}: <span class="tooltip-value">${info?.artist_name || "Unknown"}</span><br/>
//           ${t.year}: <span class="tooltip-value">${info?.release_year || "Unknown"}</span>
//         `;
//       }
//       updateTooltipPosition(e, tooltip);
//     };
    
//     const mouseLeave = () => {
//       if (cluster.dataset.state !== "comparing") return;
//       cluster.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
//       cluster.style.zIndex = "1";
//       tooltip.style.opacity = 0;
//     };
    
//     cluster.addEventListener("mouseenter", mouseEnter);
//     cluster.addEventListener("mouseleave", mouseLeave);
//     cluster.addEventListener("mousemove", (e) => updateTooltipPosition(e, tooltip));
    
//     cluster.style.pointerEvents = "auto";
//     cluster._eventsBound = true;
//   }
  
//   // ==================== 创建左侧 clusters（动态尺寸）====================
//   function createLeftClusters(layout) {
//     // 移除旧的
//     leftClusters.forEach(cluster => cluster.remove());
//     leftClusters = [];
    
//     const { count, cols, gapX, gapY, size, startX, startY } = layout.left;
    
//     for (let i = 0; i < count; i++) {
//       const cluster = document.createElement("div");
//       cluster.className = "albums500Greatest";
      
//       const albumId = `${i + 1}`;
//       cluster.dataset.id = albumId;
      
//       // 计算网格位置
//       const col = i % cols;
//       const row = Math.floor(i / cols);
//       const targetX = startX + col * gapX;
//       const targetY = startY + row * gapY;
      
//       // 🟢 动态设置尺寸
//       cluster.style.width = `${size}px`;
//       cluster.style.height = `${size}px`;
//       cluster.style.position = "absolute";
//       cluster.style.borderRadius = `${Math.max(2, size / 8)}px`;
//       cluster.style.transformOrigin = "center center";
//       cluster.style.opacity = "0";
//       cluster.style.left = `${targetX}px`;
//       cluster.style.top = `${targetY}px`;
//       cluster.style.cursor = "pointer";
//       cluster.style.transition = "opacity 0.5s ease, transform 0.2s ease";
      
//       // 🟢 根据年份设置颜色
//       const albumInfo = greatestAlbumInfos[albumId];
//       const releaseYear = albumInfo?.release_year;
      
//       if (releaseYear && releaseYear < 2000) {
//         cluster.style.background = "#af56d8";  // 2000年前：紫色
//       } else {
//         cluster.style.background = "#b7e066";  // 2000年及以后：黄绿色
//       }
      
//       container.appendChild(cluster);
//       leftClusters.push(cluster);
      
//       // 绑定 hover 事件
//       bindLeftClusterEvents(cluster, albumInfo, tooltip, t);
//     }
    
//     // 淡入动画
//     requestAnimationFrame(() => {
//       leftClusters.forEach(cluster => {
//         cluster.style.opacity = "1";
//       });
//     });
//   }
  
//   // ==================== 绑定左侧 cluster 事件 ====================
//   function bindLeftClusterEvents(cluster, albumInfo, tooltip, t) {
//     const hoverScale = 1.3;
    
//     cluster.addEventListener("mouseenter", (e) => {
//       if (!albumInfo) return;
      
//       cluster.style.transform = `scale(${hoverScale})`;
//       cluster.style.zIndex = "100";
      
//       tooltip.innerHTML = `
//         <strong>${albumInfo.album_name || "Unknown Album"}</strong><br/>
//         ${t.artists}: <span class="tooltip-value">${albumInfo.artist_name || "Unknown"}</span><br/>
//         ${t.year}: <span class="tooltip-value">${albumInfo.release_year || "Unknown"}</span>
//       `;
      
//       updateTooltipPosition(e, tooltip);
//     });
    
//     cluster.addEventListener("mousemove", (e) => {
//       if (!albumInfo) return;
//       updateTooltipPosition(e, tooltip);
//     });
    
//     cluster.addEventListener("mouseleave", () => {
//       cluster.style.transform = "scale(1)";
//       cluster.style.zIndex = "1";
//       tooltip.style.opacity = 0;
//     });
//   }
  
//   // ==================== Tooltip 位置检测 ====================
//   function updateTooltipPosition(e, tooltip) {
//     requestAnimationFrame(() => {
//       const tooltipRect = tooltip.getBoundingClientRect();
//       let left = e.clientX + 15;
//       let top = e.clientY - 40;
      
//       // 右边界检测
//       if (left + tooltipRect.width > window.innerWidth) {
//         left = e.clientX - tooltipRect.width - 15;
//       }
//       // 左边界检测
//       if (left < 0) left = 10;
//       // 上边界检测
//       if (top < 0) top = e.clientY + 20;
//       // 下边界检测
//       if (top + tooltipRect.height > window.innerHeight) {
//         top = e.clientY - tooltipRect.height - 10;
//       }
      
//       tooltip.style.left = `${left}px`;
//       tooltip.style.top = `${top}px`;
//       tooltip.style.opacity = 1;
//     });
//   }
  
//   // ==================== 窗口缩放响应 ====================
//   function handleResize() {
//     const newLayout = calculateResponsiveLayout(window.innerWidth, window.innerHeight);
//     currentLayout = newLayout;
    
//     // 更新右侧位置
//     updateRightClusters(newLayout);
    
//     // 重新创建左侧（尺寸会重新计算）
//     createLeftClusters(newLayout);
//   }
  
//   // ==================== 初始化 ====================
//   function init() {
//     currentLayout = calculateResponsiveLayout(window.innerWidth, window.innerHeight);
//     updateRightClusters(currentLayout);
//     createLeftClusters(currentLayout);
//   }
  
//   init();
  
//   // 监听窗口缩放
//   window.addEventListener("resize", handleResize);
  
//   // 返回清理函数
//   return () => {
//     window.removeEventListener("resize", handleResize);
//     leftClusters.forEach(cluster => cluster.remove());
//     leftClusters = [];
//   };
// }
