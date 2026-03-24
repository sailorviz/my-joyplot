/**
 * clusteringByTopArtists
 * @param {HTMLElement} container - 当前 FloatingSongs 的容器
 * @param {string[]} allSongs - 全部 2000+ 首歌曲
 * @returns {Object} clusterData - 包含每个 cluster 的已显示和未显示歌曲
 */
export function clusteringData(container, allSongs) {
  // --------------------------
  // 1️⃣ 统计每个艺术家的全部歌曲
  // --------------------------
  const clustersMap = {};

  // allSongs 是 [{id, name, artist}, ...]
  allSongs.forEach((song) => {
    const { id, name, artist } = song;
    const artists = artist?.split(/,/i).map(a => a.trim()) || [];
    
    artists.forEach((a) => {
      if (!clustersMap[a]) clustersMap[a] = [];
      // 每首歌存对象 {id, name} 而不是只存 name
      clustersMap[a].push({ id, name });
    });
  });

  // --------------------------
  // 2️⃣ 取 top30 artist
  // --------------------------
  const topArtists = Object.entries(clustersMap)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 30)
    .map(([artist, songs]) => ({ artist, songs }));// songs 是 {id, name} 对象数组
  
  const newArtists = ["Queen", "Thee Sacred Souls", "莫文蔚Karen Mok"];
  newArtists.forEach((name, i) => {
    const n = topArtists.length;
    topArtists[n - 3 + i] = {
      artist: name,
      songs: clustersMap[name] || [] // 从 clustersMap 获取对应 songs
    };
  });

  // --------------------------
  // 3️⃣ 获取当前屏幕上的歌曲 DOM 和内容
  // --------------------------
  const children = Array.from(container.children); // 假设这就是 100 个流动元素
  const displayedSongs = children.map(el => ({
    id: el.dataset.id,
    name: el.dataset.name,
    artist: el.dataset.artist,
  }));

  // --------------------------
  // 4️⃣ 按 top30 artist 聚类当前显示的歌曲
  // --------------------------
  const clusterData = {}; // 每个 cluster 存放已显示和未显示歌曲
  topArtists.forEach(c => {
    clusterData[c.artist] = {
      displayedSongs: [],      // 当前屏幕显示的
      remainingSongs: []       // 屏幕未显示的
    };
  });
  clusterData["Other"] = {
    displayedSongs: [],      // 当前屏幕显示的
    remainingSongs: []       // 屏幕未显示的
  }; // 非 top30

  displayedSongs.forEach(song => {
    // 找出 song 属于哪个 cluster
    let found = false;
    for (const c of topArtists) {
      if (c.songs.some(s => s.id === song.id)) {
        clusterData[c.artist].displayedSongs.push(song);
        found = true;
        break;
      }
    }
    if (!found) {
      clusterData["Other"].displayedSongs.push(song);
    }
  });

  // --------------------------
  // 5️⃣ 填充每个 cluster 的未显示歌曲（全部 2000+）
  // --------------------------
  topArtists.forEach(c => {
    const remaining = c.songs.filter(
      s => !clusterData[c.artist].displayedSongs.some(ds => ds.id === s.id)
    );
    clusterData[c.artist].remainingSongs = remaining;
  });
  // --------------------------
  // 6️⃣ 返回 clusterData
  // --------------------------
  return clusterData;
}
