import { updateLegend } from "../../../components/updateLegend";
import * as d3 from 'd3';

export function backTo2KDE(containerRef, language){
  // 获取cluster元素, hide
  const clusterElsNodeList = containerRef.current.querySelectorAll(".top50-songs");
  const clusters = Array.from(clusterElsNodeList);
  clusters.forEach((el) => {
    el.style.opacity = 0;
    el.style.transition = "opacity 0.3s";
    el.style.pointerEvents = "none";
  });

  // 显示 timeline SVG
  const oldTimeline = containerRef.current.querySelector(".songs-timeline");
  if (oldTimeline) oldTimeline.style.opacity = 1;
  const overlay = oldTimeline.querySelector(".popularity-kde-overlay");
  if (overlay) overlay.style.pointerEvents = "all";

  // 显示 timeline title&legend SVG
  const popTexts = {
    zh: {
      title: '歌曲发行时间线与流行度',
    },
    en: {
      title: 'Songs Release Timeline & Popularity',
    }
  };
  const t = popTexts[language] || popTexts.en;

  const oldTitleLegend = d3.select(containerRef.current).select(".songs-titleLegend");
  if (!oldTitleLegend.empty()) {
    oldTitleLegend.style("opacity", 1);
    oldTitleLegend.select(".title").text(t.title);
    updateLegend(oldTitleLegend.select(".legend"), "kdeOfTwo", language);
  }
}