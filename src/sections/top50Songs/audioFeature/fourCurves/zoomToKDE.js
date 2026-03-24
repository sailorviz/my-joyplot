import * as d3 from "d3";
import { getRectCenter } from "../../../../components/getRectCenter";

export function zoomToKDE(container, featureKey) {
  const scale = 2.2;
  const dimOpacity = 0.15;

  const grid = container.querySelector(".kde-grid");
  const target = grid.querySelector(`.kde-card-${featureKey}`);
  const xAxis = d3.select(target).select(".x-axis");
  const title = target.querySelector(".kde-card-title");
  if (!grid || !target || !xAxis) return;

  const gridRect = grid.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  const gridCenter = getRectCenter(gridRect);
  const targetCenter = getRectCenter(targetRect);

  const dx = gridCenter.x - targetCenter.x;
  const dy = gridCenter.y - targetCenter.y;

  // 所有 KDE 先 reset
  grid.querySelectorAll(".kde-card").forEach(card => {
    card.style.transition = "transform 0.9s ease, opacity 0.6s ease";
    card.style.transform = "translate(0, 0) scale(1)";
    card.style.opacity = dimOpacity;
    card.style.zIndex = 1;
  });

  // 目标 KDE 放大并居中
  target.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
  target.style.opacity = 1;
  target.style.zIndex = 10;

  setTimeout(() => {
    xAxis
      .transition()
      .duration(500)
      .style("opacity", 1);
    title.style.opacity = 1;
    title.style.transition = "opacity 0.5s ease";
  }, 500);
}