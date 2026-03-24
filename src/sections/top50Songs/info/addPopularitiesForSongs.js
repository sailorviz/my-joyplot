import * as d3 from "d3";
import { updateLegend } from "../../../components/updateLegend";
import { compareWithArtistOrAlbum } from "./compareWithArtistOrAlbum";
import { registerHandlers } from "../../../components/registerHandlers";
import { switchHandlers } from "../../../components/switchHandlers";

export function addPopularitiesForSongs(containerRef, songs, context) { 
  const { timelineSvg, releaseYear, xScale, timelineHeight, offsetY, legend, timelineWidth, offsetX, titleLegendSvg, title } = context;

  if (!timelineSvg) {
    console.warn("Timeline SVG not found. Did you call triggerPlottingTimeline() first?");
    return;
  }

  console.log("addPopularitiesForSongs is triggering...");

  // 回到基础 timeline 状态
  const comparator = compareWithArtistOrAlbum(containerRef, songs, timelineSvg, timelineHeight, offsetY, xScale);
  comparator.reset();
  updateLegend(legend, "songs");

  // 获取 clusters
  if (!containerRef?.current) return;
  const clusterEls = containerRef.current.querySelectorAll(".top50-songs");
  const clusterElsArray = Array.from(clusterEls);

  // ----------------------------
  // Y 轴 & scale
  // ----------------------------
  timelineSvg.select(".y-axis").remove();
  timelineSvg.select(".y-grid").remove();
  timelineSvg.selectAll(".axis-title").remove();
  timelineSvg.selectAll(".y-expand").remove();
  timelineSvg.select(".frame").remove();

  const yDomain = [-20, 100]; // 用于延长线
  const yScale = d3.scaleLinear()
    .domain(yDomain)
    .range([timelineHeight - offsetY, offsetY]); 

  const yAxis = d3.axisLeft(yScale)
    .ticks(7)
    .tickSize(5)
    .tickPadding(8);

  const axisX = offsetX - 70;

  // 绘制 Y 轴
  timelineSvg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${axisX},0)`)
    .call(yAxis)
    .selectAll("line")
    .attr("stroke", "#333");

  timelineSvg.select(".y-axis")
    .selectAll(".tick text")
    .filter(d => d === -20)
    .attr("opacity", 0);  

  timelineSvg.select(".y-axis path")
    .attr("stroke", "#333")
    .attr("stroke-width", 2);

  // Y 轴延长线 + 箭头
  const topY = offsetY;
  const extendLen = 50;

  timelineSvg.append("line")
    .attr("class", "y-expand line")
    .attr("x1", axisX)
    .attr("y1", topY)
    .attr("x2", axisX)
    .attr("y2", topY - extendLen)
    .attr("stroke", "#333")
    .attr("stroke-width", 2);

  timelineSvg.append("path")
    .attr("class", "y-expand arrow")
    .attr("d", `
      M ${axisX - 5},${topY - extendLen + 6}
      L ${axisX + 5},${topY - extendLen + 6}
      L ${axisX},${topY - extendLen}
      Z
    `)
    .attr("fill", "#333");

  // 横向网格线
  const yGrid = d3.axisLeft(yScale)
    .ticks(7)
    .tickSize(-(timelineWidth - axisX*2 - 40))
    .tickFormat("");

  timelineSvg.append("g")
    .attr("class", "y-grid")
    .attr("transform", `translate(${axisX},0)`)
    .call(yGrid)
    .selectAll("line")
    .attr("stroke", "#ddd")
    .attr("stroke-width", 1)
    .attr("opacity", 0.7);

  // 去掉左侧 path
  timelineSvg.select(".y-grid").select("path").remove();
  // 删除最底部横线
  timelineSvg.select(".y-grid")
    .selectAll(".tick")
    .filter(d => d === yDomain[0])
    .select("line")
    .remove();

  // 外框：上/右
  const frameTopY = offsetY;
  const frameBottomY = timelineHeight - offsetY;
  const frameRightX = timelineWidth - axisX - 40;

  timelineSvg.append("line") // 右边框
    .attr("class", "frame")
    .attr("x1", frameRightX)
    .attr("y1", frameTopY)
    .attr("x2", frameRightX)
    .attr("y2", frameBottomY)
    .attr("stroke", "#ddd")
    .attr("stroke-width", 1);

  // X 轴标题
  timelineSvg.append("text")
    .attr("class", "axis-title x-axis-title")
    .attr("x", timelineWidth / 2)
    .attr("y", frameBottomY + 40)
    .attr("text-anchor", "middle")
    .attr("font-size", 16)
    .attr("font-weight", "bold")
    .attr("fill", "#333")
    .text("Release Year");

  // Y 轴标题
  timelineSvg.append("text")
    .attr("class", "axis-title y-axis-title")
    .attr("x", -timelineHeight / 2)
    .attr("y", axisX - 40)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("font-size", 16)
    .attr("font-weight", "bold")
    .attr("fill", "#333")
    .text("Popularity (0–100)");

  // titleLegend 移动 & 更新文本
  const titleLegendTy = -150;
  const durationY = 500;
  titleLegendSvg
    .style("transition", `transform ${durationY}ms ease-out`)
    .style("transform", `translateY(${titleLegendTy}px)`);
  title.text("Songs Release Timeline & Popularity");

  // ----------------------------
  // Tooltip & Move clusters
  // ----------------------------
  const tooltip = containerRef.current.querySelector(".songs-tooltip");
  const rect = containerRef.current.getBoundingClientRect();
  const svgRect = timelineSvg.node().getBoundingClientRect();

  clusterElsArray.forEach(el => {
    const id = el.dataset.id;
    let pop = Number(songs[id]?.popularity);
    if (isNaN(pop)) pop = 0;

    const elRect = el.getBoundingClientRect();
    const targetY = yScale(pop) + svgRect.y - elRect.height/2;

    let prevTx = parseFloat(el.dataset.tx) || 0;
    let prevTy = parseFloat(el.dataset.ty) || 0;

    const ty = targetY - elRect.y;
    const popTy = prevTy + ty;
    const popTx = prevTx;

    el.style.transform = `translate(${popTx}px, ${popTy}px) scale(0.3)`;
    el.style.transition = `transform ${durationY}ms`;

    el.dataset.state = "pop";
    el.dataset.popTx = popTx;
    el.dataset.popTy = popTy;

    el.onmouseenter = null;
    el.onmousemove = null;
    el.onmouseleave = null;
    if (!el._handlers) el._handlers = {};

    const song = songs[id].song;
    const artist = songs[id].artist;
    const songReleaseYear = songs[id].release_year;

    const popMouseEnter = (e) => {
      if (el.dataset.state !== "pop") return;
      el.style.transform = `translate(${popTx}px, ${popTy}px) scale(0.35)`;
      tooltip.innerHTML = `${song} - ${artist}<br>Year: ${songReleaseYear}<br>Popularity: ${pop || "null"}`;
      tooltip.style.left = `${e.clientX - rect.left + 10}px`;
      tooltip.style.top = `${e.clientY - rect.top - 40}px`;
      tooltip.style.opacity = 1;
    };
    const popMouseMove = (e) => {
      tooltip.style.left = `${e.clientX - rect.left + 10}px`;
      tooltip.style.top = `${e.clientY - rect.top - 40}px`;
    };
    const popMouseLeave = () => {
      if (el.dataset.state !== "pop") return;
      el.style.transform = `translate(${popTx}px, ${popTy}px) scale(0.3)`;
      tooltip.style.opacity = 0;
    };

    registerHandlers(el, "pop", { mouseenter: popMouseEnter, mousemove: popMouseMove, mouseleave: popMouseLeave });
    switchHandlers(el, "drop", "pop");
    el.style.pointerEvents = "auto";
  });

  return {
    timelineSvg,
    yScale,
    legend,
    axisX,
    clusterElsArray
  };
}
