export function focusTop1Album(container, albumInfos, language){
  const clusterEls = container.querySelectorAll(".clusterForAlbum");
  const clusterElsArray = Array.from(clusterEls);
  const top1Album = clusterElsArray[0];
  const otherAlbums = clusterElsArray.slice(1);

  const centerX = window.innerWidth / 3;
  const centerY = window.innerHeight / 2;
//获取第一个cluster的当前坐标
  const rect = top1Album.getBoundingClientRect();
  const currentX = rect.left + rect.width / 2;
  const currentY = rect.top + rect.height / 2;
//计算平移量
  const translateX = centerX - currentX;
  const translateY = centerY - currentY;
//状态设置，回滚时取消
  top1Album.dataset.focused = "true";

  Object.assign(top1Album.style, {
    transition: "transform 1s ease, z-index 0.5s",
    zIndex: 999, // 确保在最上层
    transform: `translate(${translateX}px, ${translateY}px) scale(2)`,// 放大 2 倍
    pointerEvents: "none",
    maxWidth: "50vh"
  });

  otherAlbums.forEach(el => {
    Object.assign(el.style, {
      transition: "filter 0.8s ease, opacity 0.8s ease",
      filter: "grayscale(100%)",
      opacity: 0.3,
      pointerEvents: "none" // 防止点击
    });
  });

  // 创建 info 元素
  const infoDiv = document.createElement("div");
  infoDiv.className = "album-info";
  Object.assign(infoDiv.style, {
    position: "fixed", // 相对于 clusterEl 定位
    color: "white",
    background: "rgba(0,0,0,0.6)",
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    maxWidth: "30vh",
    opacity: 0,
    transition: "opacity 0.5s ease",
    zIndex: 1000 // 高于 top1Album
  });

  const tooltipTexts = {
    zh: {
      artists: '艺人',
      genre: '风格',
      year: '年份',
      language: '语言',
      songsCollected: '收录歌曲',
      totalTracks: '总曲目数',
      collectionRate: '收录率'
    },
    en: {
      artists: 'Artists',
      genre: 'Genre',
      year: 'Year',
      language: 'Language',
      songsCollected: 'Songs Collected',
      totalTracks: 'Total Tracks',
      collectionRate: 'Collection Rate'
    }
  };

  const t = tooltipTexts[language] || tooltipTexts.en;

  // 设置 info 内容
  const info = albumInfos[top1Album.dataset.album];
  infoDiv.innerHTML = `
    <strong>《${top1Album.dataset.album}》</strong><br>
    <strong>${t.artists}</strong>: ${info?.artist_name || "Unknown"}<br/>
    <strong>${t.genre}</strong>: ${info?.Genre || "Unknown"}<br/>
    <strong>${t.year}</strong>: ${info?.release_year || "Unknown"}<br/>
    <strong>${t.language}</strong>: ${info?.Language || "Unknown"}<br/>
    <strong>${t.songsCollected}</strong>: ${info?.song_count || 0}<br/>
    <strong>${t.totalTracks}</strong>: ${info?.total_tracks || 0}<br/>
    <strong>${t.collectionRate}</strong>: ${info?.collection_rate || 0}%
  `;


  // 将 infoDiv 添加到 body
  top1Album.appendChild(infoDiv);

  // 设置相对于 clusterEl 的位置（比如右侧）
  Object.assign(infoDiv.style, {
    left: `${top1Album.offsetWidth + 10}px`, // 右侧间距
    top: `0px` 
  });

  // 延迟显示，让 cluster 动画完成后淡入
  setTimeout(() => {
    infoDiv.style.opacity = 1;
  }, 1000);

}