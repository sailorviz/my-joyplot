import { forClusterPosition } from "./forClusterPosition";

export function animateCluster(containerRef, clusterData) {
  forClusterPosition(containerRef, clusterData, ({ data, clusterCenterX, clusterCenterY, clusterOpacity }) => {
    data.displayedSongs.forEach((song, idx) => {
      const el = Array.from(containerRef.current.children)
        .find(c => c.dataset.id === song.id);
      if (!el) return;

      const targetLeft = clusterCenterX + (Math.random() - 0.5) * 100;
      const targetTop = clusterCenterY + (idx - data.displayedSongs.length / 2) * 14;

      el.style.transition = "all 1s ease";
      el.style.left = `${targetLeft}px`;
      el.style.top = `${targetTop}px`;
      el.style.fontSize = `10px`;
      el.style.opacity = clusterOpacity;
      
    });
  });

  clusterData["Other"]?.displayedSongs.forEach(song => {
    const el = Array.from(containerRef.current.children)
      .find(c => c.dataset.id === song.id);
    if (!el) return;
    el.style.transition = "opacity 0.5s";
    el.style.opacity = 0;
  });
}
