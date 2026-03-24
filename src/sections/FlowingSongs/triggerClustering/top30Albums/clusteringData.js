/**
 * clusteringByTopArtists
 * @param {HTMLElement} container - 当前 FloatingSongs 的容器
 * @param {string[]} allSongs - 全部 2000+ 首歌曲
 * @returns {Object} clusterData - 包含每个 cluster 的已显示和未显示歌曲
 */
export function clusteringData(container, allSongs) {
  // --------------------------
  // 1️⃣ 统计每张album的全部歌曲
  // --------------------------
  const clustersMap = {};

  // allSongs 是 [{id, name, artist，album}, ...]
  allSongs.forEach((song) => {
    const { id, name, artist, album } = song;
    if (!clustersMap[album]) clustersMap[album] = [];
    clustersMap[album].push({ id, name, artist });
  });

  // --------------------------
  // 2️⃣ 取 top30 albums
  // --------------------------
  const topAlbums = Object.entries(clustersMap)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 30)
    .map(([album, songs]) => ({ album, songs }));
  
  const replaceIndexes = [23, 24, 25, 27, 28, 29];
  const newAlbumName = ["王菲97", "Analog Love", "Fonk Delight", "Thee Sacred Souls", "Tuxedo II", "YOSHINO FUJIMAL (2022 Remaster)"];
  let newAlbums = [];
  newAlbumName.forEach(name => {
    const newAlbumSongs = clustersMap[name];
    newAlbums.push({
      album: name,                               // 正确赋值 album
      songs: newAlbumSongs                       // 正确赋值 songs
    });
  });
  replaceIndexes.forEach((idx, i) => {
    topAlbums.splice(idx, 1, newAlbums[i]);
  });

  // --------------------------
  // 3️⃣ 获取当前屏幕上的歌曲 DOM 和内容
  // --------------------------
  const children = Array.from(container.children); // 假设这就是 100 个流动元素
  const displayedSongs = children.map(el => ({
    id: el.dataset.id,
    name: el.dataset.name,
    artist: el.dataset.artist,
    album: el.dataset.album
  }));

  // --------------------------
  // 4️⃣ 按 top30 albums 聚类当前显示的歌曲
  // --------------------------
  const clusterData = {}; // 每个 cluster 存放已显示和未显示歌曲
  topAlbums.forEach(c => {
    clusterData[c.album] = {
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
    for (const c of topAlbums) {
      if (c.songs.some(s => s.id === song.id)) {
        clusterData[c.album].displayedSongs.push(song);
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
  topAlbums.forEach(c => {
    const remaining = c.songs.filter(
      s => !clusterData[c.album].displayedSongs.some(ds => ds.id === s.id)
    );
    clusterData[c.album].remainingSongs = remaining;
  });
  // --------------------------
  // 6️⃣ 返回 clusterData
  // --------------------------
  console.log(topAlbums.map(a => a.album));
  return clusterData;
}

// clusterData = {
//   "Album A": {
//     displayedSongs: [
//       { id, name, artist, album },
//       ...
//     ],
//     remainingSongs: [
//       { id, name, artist },
//       ...
//     ]
//   },

//   "Album B": {
//     displayedSongs: [ ... ],
//     remainingSongs: [ ... ]
//   },

//   ...

//   "Other": {
//     displayedSongs: [
//       { id, name, artist, album },
//       ...
//     ],
//     remainingSongs: []
//   }
// }
