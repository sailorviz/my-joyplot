import { switchHandlers } from "../../../components/switchHandlers";

export function backToBaseSquaresAgain(containerRef, songs){
  // hide timeline SVG
  const oldTimeline = containerRef.current.querySelector(".songs-timeline");
  if (oldTimeline) {
    oldTimeline.style.opacity = 0;
    oldTimeline.style.pointerEvents = "none";
  }
  const oldOverlay = containerRef.current.querySelector(".popularity-kde-overlay");
  if (oldOverlay) oldOverlay.style.pointerEvents = "none";

  // hide timeline title&legend SVG
  const oldTitleLegend = containerRef.current.querySelector(".songs-titleLegend");
  if (oldTitleLegend) oldTitleLegend.style.opacity = 0;

  // 获取cluster元素
  const clusterElsNodeList = containerRef.current.querySelectorAll(".top50-songs");
  const clusters = Array.from(clusterElsNodeList);

  clusters.forEach((el) => {
    const id = el.dataset.id;
    const song = songs[id];
    const artists = song.artist.split(",").map(a => a.trim());
    el.innerHTML = `
      <div class="song-title">${song.song}</div>
      <div class="song-artists">
        ${artists.map(a => `<div class="artist-line">${a}</div>`).join("")}
      </div>
    `;

    el.style.transform = `scale(1)`;
    const left = parseFloat(el.dataset.left) || 0;
    const top = parseFloat(el.dataset.top) || 0;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;

    el.style.opacity = 1;
    el.style.transition = "opacity 0.3s";

    el.dataset.state = "initial";
    switchHandlers(el, "drop", "initial");
    el.style.pointerEvents = "auto";
  });
}