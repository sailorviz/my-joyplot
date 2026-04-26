import { drawReleaseYearDensity } from "./drawReleaseYearDensity";
import { updateLegend } from "../../../components/updateLegend";
import * as d3 from "d3";

export function backToTimelineWithSquares(containerRef, context, language) {
  const { timelineSvg, releaseYear, xScale, timelineHeight, offsetY, legend} = context;
  if (!timelineSvg) {
    console.warn("Timeline SVG not found. Did you call triggerPlottingTimeline() first?");
    return;
  }
  const clusterElsNodeList = containerRef.current.querySelectorAll(".top50-songs");
  const clusters = Array.from(clusterElsNodeList);
  clusters.forEach(el => {
    el.style.opacity = 1;
    el.style.transition = "opacity 0.3s";
    el.style.pointerEvents = "auto";
  });

  // 计算密度曲线
  const kdeControls = drawReleaseYearDensity(timelineSvg, releaseYear, xScale, timelineHeight, offsetY, legend);
  // 再切换回来显示 KDE
  kdeControls.hide();
  updateLegend(legend, "songs", language);

}