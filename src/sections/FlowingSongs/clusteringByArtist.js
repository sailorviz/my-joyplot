// clustering.js
import * as d3 from "d3";

export function clusterByArtist(container, songs) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // 分组（假设 artist 以逗号分隔）
  const clusters = {};
  songs.forEach(song => {
    const [name, artistStr] = song.split(" - ");
    const artists = artistStr.split(/,|&|x|feat\.?/i).map(a => a.trim());
    artists.forEach(artist => {
      if (!clusters[artist]) clusters[artist] = [];
      clusters[artist].push(name);
    });
  });

  // 取前30个 artist
  const topArtists = Object.entries(clusters)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 30);

  // 随机矩形聚类位置
  const rects = d3.range(topArtists.length).map(() => ({
    x: Math.random() * (width - 200),
    y: Math.random() * (height - 200),
    w: 180,
    h: 140,
  }));

  const children = container.children;
  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    const artist = el.textContent.split(" - ")[1];
    const clusterIndex = topArtists.findIndex(([a]) => artist.includes(a));
    if (clusterIndex >= 0) {
      const rect = rects[clusterIndex];
      el.style.transition = "all 2s ease-in-out";
      el.style.left = `${rect.x + Math.random() * rect.w}px`;
      el.style.top = `${rect.y + Math.random() * rect.h}px`;
    } else {
      el.style.opacity = 0.1;
    }
  }
}
