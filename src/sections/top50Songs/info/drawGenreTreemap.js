import { genreColorMap } from "../../../components/genreColorMap";
import { genreNodesData } from "../../../components/genreNodesData";
import { drawTreemap } from "./drawTreemap";

export function drawGenreTreemap(container){
  const clusterElsNodeList = container.querySelectorAll(".top50-songs");
  const clusters = Array.from(clusterElsNodeList);
  clusters.forEach(el => {
    el.style.opacity = 0;
    el.style.pointerEvents = "none";
  })
  
  const type = "Genre";
  const categoryColorMap = null;
  drawTreemap(type, genreNodesData, genreColorMap, categoryColorMap, container);
}