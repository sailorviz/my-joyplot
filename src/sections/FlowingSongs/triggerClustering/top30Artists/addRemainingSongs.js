import { forClusterPosition } from "./forClusterPosition";

export function addRemainingSongs(containerRef, clusterData) {
  forClusterPosition(containerRef, clusterData, ({ artist, data, clusterIndex, clusterOpacity }) => {
    data.remainingSongs.forEach((song, idx) => {
      const el = document.createElement("div"); // 在初始的100个div之后创建新的div
      el.className = "song adding-song";
      el.dataset.id = song.id;
      el.dataset.name = song.name;
      el.dataset.artist = song.artist;
      el.dataset.album = song.album;
      el.textContent = `${song.name} - ${artist}`;

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
