import { cluster } from "d3";

export function highlightAlbumFromBand(container, albumInfos) {
  console.log("highlightAlbumFromBand is triggering...")
  if (!container || !albumInfos) return;

  const clusters = container.querySelectorAll(".clusterForAlbum");
  const newLeftClusters = container.querySelectorAll(".albums500Greatest");

  newLeftClusters.forEach(el => {
    el.style.opacity = 0;
    el.style.pointerEvents = "none";
  })

  clusters.forEach(clusterEl => {
    const album = clusterEl.dataset.album;
    const info = albumInfos[album];
    if (!info) return;

    if (info.if_band === 1) {
      clusterEl.classList.add("band-highlight");
      clusterEl.dataset.band = "true";
    } else {
      clusterEl.classList.remove("band-highlight");
      clusterEl.dataset.band = "false";
    }

  });
}
