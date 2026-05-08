import { forClusterPosition } from "../top30Artists/forClusterPosition";

export function addRemainingSongs(containerRef, clusterData) {
  forClusterPosition(containerRef, clusterData, ({ artist, data, clusterIndex, clusterOpacity }) => {
    // 判断是否为郭顶的《飞行器的执行周期》
    if (artist === "郭顶" || data.album === "飞行器的执行周期") {
      const songNames = data.remainingSongs.map(song => song.name);
      console.log("《飞行器的执行周期》剩余歌曲：", songNames);
      
      // 或者更详细地输出
      data.remainingSongs.forEach((song, idx) => {
        console.log(`歌曲 ${idx + 1}: ${song.name}`);
      });
    }
    
    data.remainingSongs.forEach((song, idx) => {
      const el = document.createElement("div"); // 在初始的100个div之后创建新的div
      el.className = "song adding-song";
      el.dataset.id = song.id;
      el.dataset.name = song.name;
      el.dataset.artist = song.artist;
      el.dataset.album = song.album;
      el.textContent = `${song.name} - ${song.artist}`;

      el.style.position = "absolute";
      el.style.left = `${Math.random() * window.innerWidth}px`;
      el.style.top = `${window.innerHeight + Math.random() * 100}px`;
      el.style.opacity = 0;
      el.style.fontSize = `10px`;

      containerRef.current.appendChild(el);

      const delay = idx * 100 + clusterIndex * 100;
      setTimeout(() => {
        el.style.opacity = clusterOpacity;
      }, delay);
    });
  });
}
