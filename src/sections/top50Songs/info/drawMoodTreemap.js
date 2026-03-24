import { moodColorMap, moodCategoryColors } from "../../../components/moodColorMap";
import { moodNodesData } from "../../../components/moodNodesData";
import { drawTreemap } from "./drawTreemap";

export function drawMoodTreemap(container){
  const clusterElsNodeList = container.querySelectorAll(".top50-songs");
  const clusters = Array.from(clusterElsNodeList);
  clusters.forEach(el => {
    el.style.opacity = 0;
    el.style.pointerEvents = "none";
  })
  
  const type = "Mood";
  drawTreemap(type, moodNodesData, moodColorMap, moodCategoryColors, container);
}