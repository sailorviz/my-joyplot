import { drawPopularityDensity } from "./drawPopularityDensity";

export function triggerDrawPopularityDensity(songs, popContext) {
  const { timelineSvg, yScale, legend, axisX, clusterElsArray } = popContext;
  if (!timelineSvg) {
    console.warn("Timeline SVG not found. Did you call triggerPlottingTimeline() first?");
    return;
  }

  clusterElsArray.forEach(el => {
    el.style.opacity = 0;
    el.style.transition = "opacity 0.3s";
    el.style.pointerEvents = "none";
  });

  // 计算密度曲线
  const kdeControls = drawPopularityDensity(songs, timelineSvg, yScale, legend, axisX);
  // 再切换回来显示 KDE
  kdeControls.show();
  // ★ 这里保存 step1 的结果
  const kdeContextFromStep1 = {
    kdeTop50: kdeControls.kdeTop50,
    xScaleDensity50: kdeControls.xScaleDensity50,
    groupTop50: kdeControls.groupTop50
  };
  return kdeContextFromStep1;
}