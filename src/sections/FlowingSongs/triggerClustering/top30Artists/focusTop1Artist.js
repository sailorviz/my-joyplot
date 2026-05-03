export function focusTop1Artist(container, artistInfos, language){
  const clusterEls = container.querySelectorAll(".clusterForArtist");
  const clusterElsArray = Array.from(clusterEls);
  const top1Artist = clusterElsArray[0];
  const otherArtists = clusterElsArray.slice(1);

  const centerX = window.innerWidth / 3;
  const centerY = window.innerHeight / 2;
//获取第一个cluster的当前坐标
  const rect = top1Artist.getBoundingClientRect();
  const currentX = rect.left + rect.width / 2;
  const currentY = rect.top + rect.height / 2;
//计算平移量
  const translateX = centerX - currentX;
  const translateY = centerY - currentY;
//状态设置，回滚时取消
  top1Artist.dataset.focused = "true";

  Object.assign(top1Artist.style, {
    transition: "transform 1s ease, z-index 0.5s",
    zIndex: 999, // 确保在最上层
    transform: `translate(${translateX}px, ${translateY}px) scale(2)` // 放大 2 倍
  });

  otherArtists.forEach(el => {
    Object.assign(el.style, {
      transition: "filter 0.8s ease, opacity 0.8s ease",
      filter: "grayscale(100%)",
      opacity: 0.3,
      pointerEvents: "none" // 防止点击
    });
  });

  // 创建 info 元素
  const infoDiv = document.createElement("div");
  infoDiv.className = "artist-info";

  const textsUI = {
    zh: { 
      gender: '性别',
      country: '国家',
      genre: '风格',
      songsCollected: '歌曲收藏数'
    },
    en: { 
      gender: 'Gender',
      country: 'Country',
      genre: 'Genre',
      songsCollected: 'Songs Collected'
    }
  };

  // 设置 info 内容
  const info = artistInfos[top1Artist.dataset.artist];
  infoDiv.innerHTML = `
    <strong>${top1Artist.dataset.artist}</strong><br>
    ${textsUI[language].genre}: <span class="tooltip-value">${info?.Genre || "Unknown"}</span><br>
    ${textsUI[language].country}: <span class="tooltip-value">${info?.Country || "Unknown"}</span><br>
    ${textsUI[language].songsCollected}: <span class="tooltip-value">${info?.song_count || 0}</span>
  `;

  // 将 infoDiv 添加到 clusterEl 下
  top1Artist.appendChild(infoDiv);

  // 设置相对于 clusterEl 的位置（比如右侧）
  Object.assign(infoDiv.style, {
    left: `${top1Artist.offsetWidth + 10}px`, // 右侧间距
    top: `0px`
  });

  // 延迟显示，让 cluster 动画完成后淡入
  setTimeout(() => {
    infoDiv.style.opacity = 1;
  }, 1000);

}