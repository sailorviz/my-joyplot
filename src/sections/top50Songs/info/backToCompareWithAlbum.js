import * as d3 from "d3";
import { updateLegend } from "../../../components/updateLegend";
import { compareWithArtistOrAlbum } from "./compareWithArtistOrAlbum";
import { switchHandlers } from "../../../components/switchHandlers";

export function backToCompareWithAlbum(containerRef, songs, context) { 
  const { timelineSvg, releaseYear, xScale, timelineHeight, offsetY, legend, timelineWidth, offsetX, titleLegendSvg, title } = context;

  if (!timelineSvg) {
    console.warn("Timeline SVG not found. Did you call triggerPlottingTimeline() first?");
    return;
  }

  console.log("backToCompareWithAlbum is triggering...");

  // 回到基础 timeline 状态
  const comparator = compareWithArtistOrAlbum(containerRef, songs, timelineSvg, timelineHeight, offsetY, xScale);
  comparator.compareWithAlbum();
  updateLegend(legend, "songsWithAlbum");

  // ----------------------------
  // remove 新增的元素
  // ----------------------------
  timelineSvg.select(".y-axis").remove();
  timelineSvg.select(".y-grid").remove();
  timelineSvg.selectAll(".axis-title").remove();
  timelineSvg.selectAll(".y-expand").remove();
  timelineSvg.select(".frame").remove();

  // titleLegend 移动 & 更新文本
  const titleLegendTy = 0;
  const durationY = 500;
  titleLegendSvg
    .style("transition", `transform ${durationY}ms ease-out`)
    .style("transform", `translateY(${titleLegendTy}px)`);
  title.text("Songs Release Timeline");

  // ----------------------------
  // Tooltip & Move clusters
  // ----------------------------

  // 获取 clusters
  if (!containerRef?.current) return;
  const clusterEls = containerRef.current.querySelectorAll(".top50-songs");
  const clusterElsArray = Array.from(clusterEls);
  // const tooltip = containerRef.current.querySelector(".songs-tooltip");
  // const rect = containerRef.current.getBoundingClientRect();
  // const svgRect = timelineSvg.node().getBoundingClientRect();

  clusterElsArray.forEach(el => {
    el.style.pointerEvents = "none";
    // const id = el.dataset.id;
    // let pop = Number(songs[id]?.popularity);
    // if (isNaN(pop)) pop = 0;

    // const elRect = el.getBoundingClientRect();
    // const targetY = yScale(pop) + svgRect.y - elRect.height/2;

    let prevTx = parseFloat(el.dataset.tx) || 0;
    let prevTy = parseFloat(el.dataset.ty) || 0;

    // const ty = targetY - elRect.y;
    // const popTy = prevTy + ty;
    // const popTx = prevTx;

    el.style.transform = `translate(${prevTx}px, ${prevTy}px) scale(0.3)`;
    el.style.transition = `transform ${durationY}ms`;

    el.dataset.state = "drop";
    // el.dataset.popTx = popTx;
    // el.dataset.popTy = popTy;

    el.onmouseenter = null;
    el.onmousemove = null;
    el.onmouseleave = null;

    switchHandlers(el, "pop", "drop");
    el.style.pointerEvents = "auto";
  });
}
