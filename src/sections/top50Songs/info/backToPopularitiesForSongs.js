import { drawPopularityDensity } from "./drawPopularityDensity";

export function backToPopularitiesForSongs(songs, popContext) {
  const { timelineSvg, yScale, legend, axisX, clusterElsArray } = popContext;
  if (!timelineSvg) {
    console.warn("Timeline SVG not found. Did you call triggerPlottingTimeline() first?");
    return;
  }

  clusterElsArray.forEach(el => {
    el.style.opacity = 1;
    el.style.transition = "opacity 0.3s";
    el.style.pointerEvents = "auto";
  });

  // 计算密度曲线
  const kdeControls = drawPopularityDensity(songs, timelineSvg, yScale, legend, axisX);
  // 再切换回来显示 KDE
  kdeControls.hide();
}