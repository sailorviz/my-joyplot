export function highlightBands(container, artistInfos) {
  if (!container || !artistInfos) return;

  const clusters = container.querySelectorAll(".clusterForArtist");

  clusters.forEach(clusterEl => {
    const artist = clusterEl.dataset.artist;
    const info = artistInfos[artist];
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
