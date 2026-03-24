import { drawGenreTreemap } from "./drawGenreTreemap";

export function moodCompareToGenreTreemap(container){
  const clusterElsNodeList = container.querySelectorAll(".top50-songs");
  const clusters = Array.from(clusterElsNodeList);
  clusters.forEach(el => {
    el.style.opacity = 0;
    el.style.pointerEvents = "none";
  })
  
  drawGenreTreemap(container);
}