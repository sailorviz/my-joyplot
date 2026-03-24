import { addPopularitiesKDEForAllSongs } from "./addPopularitiesKDEForAllSongs";

export function backToOneKDE(popContext, kdeContextFromStep1) {
  const { timelineSvg, yScale, legend, axisX, clusterElsArray } = popContext;
  if (!timelineSvg) {
    console.warn("Timeline SVG not found. Did you call triggerPlottingTimeline() first?");
    return;
  }
  
  // 计算密度曲线
  const kdeOfAllSongs = addPopularitiesKDEForAllSongs(
    timelineSvg,
    yScale,
    legend,
    axisX,

    // ★ 传入这三个
    kdeContextFromStep1.kdeTop50,
    kdeContextFromStep1.xScaleDensity50,
    kdeContextFromStep1.groupTop50
  );
  // 再切换回来显示 KDE
  kdeOfAllSongs.hide();
}