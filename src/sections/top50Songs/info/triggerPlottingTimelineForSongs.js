import * as d3 from "d3";
import { shrinkClusters } from "./shrinkClusters";
import { dropSongsClustersToTimeline } from "./dropSongsClustersToTimeline";

export function triggerPlottingTimelineForSongs(containerRef, songs){
  //获取clusters移动元素
  if (!containerRef?.current) return;
  const clusterEls = containerRef.current.querySelectorAll(".top50-songs");
  const clusterElsArray = Array.from(clusterEls);
  clusterElsArray.forEach(el => el.style.pointerEvents = "none");

  // 清除旧svg（避免重复绘制）
  d3.select(containerRef.current).select(".songs-timeline").remove();

  // 创建 timeline SVG
  const timelineHeight = 450;
  const timelineWidth = window.innerWidth; //是不是window.innerWidth的原因，因为宽度在变化
  const timelineOriginalP = 150;
  const timelineSvg = d3.select(containerRef.current)
    .append("svg")
    .attr("class", "songs-timeline")
    .attr("width", timelineWidth)
    .attr("height", timelineHeight)
    .style("position", "absolute")
    .style("top", `${timelineOriginalP}vh`) //初始位置，在视口之外下方
    .style("border", "1px solid red")

    // —— 水平居中：用像素计算 left，避免 transform 被后续覆盖
  const containerWidth = containerRef.current.clientWidth || window.innerWidth;
  const leftPx = Math.round((containerWidth - timelineWidth) / 2);
  timelineSvg.style("left", `${leftPx}px`);

  //相对于svg内部的位置偏移
  const offsetX = 300; // x 轴左右留白
  const offsetY = 50; //相对于底部

  // 清除旧svg（避免重复绘制）
  d3.select(containerRef.current).select(".songs-titleLegend").remove();
  const titleLegendHeight = 150;
  const titleLegendSvg = d3.select(containerRef.current)
  .append("svg")
  .attr("class", "songs-titleLegend")
  .attr("width", timelineWidth)
  .attr("height", titleLegendHeight)
  .style("position", "absolute")
  .style("top", `30vh`) //初始位置，在视口之外下方
  .style("z-index", -1); 

  // 添加标题
  const title = titleLegendSvg.append("text")
    .attr("class", "title")
    .attr("x", timelineWidth / 2)       // 水平居中
    .attr("y", 20)                      // 距离顶部 20px
    .attr("text-anchor", "middle")      // 居中对齐
    .attr("font-size", 20)
    .attr("font-weight", "bold")
    .attr("fill", "#333")
    .attr("opacity", 0)
    .text("Songs Release Timeline");     // 标题内容

  // 创建图例容器
  const legend = titleLegendSvg.append("g")
    .attr("class", "legend")
    .attr("opacity", 0)
    .attr("transform", `translate(${timelineWidth/6 * 4}, 50)`); // 放左上角
  
  // updateLegend(legend, "songs");

  // 获取 artist debut_year 并转为 Date
  if (!songs) return null;
  const releaseYear = songs
    .map(song => new Date(+song.release_year, 0, 1)) // 例如 "1965" -> Date对象
    .filter(d => !isNaN(d)); // 排除无效年份

  // ✅ 计算时间范围
  const domain = d3.extent(releaseYear);
  const extraLeft = 50; // ⭐ 左侧延长的像素距离
  // ✅ 创建时间比例尺
  const xScale = d3.scaleTime()
    .domain(domain)
    .range([offsetX-extraLeft, timelineWidth - offsetX]);

  // 手动生成 ticks（包含 domain 两端）
  const ticks = d3.timeYear.every(10).range(domain[0], domain[1]);
  ticks.unshift(new Date(1965, 0, 1)); // 添加左端点
  ticks.push(new Date(2024, 0, 1));    // 添加右端点
  
  // 定义坐标轴
  const xAxis = d3.axisBottom(xScale)
    .tickValues(ticks)
    .tickFormat(d3.timeFormat("%Y"))
    .tickSize(6);

  // 添加箭头定义
  timelineSvg.append("defs")
    .append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", 8)
    .attr("refY", 5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 z")
    .attr("fill", "#333");

    // 绘制 axis
  const axisGroup = timelineSvg.append("g")
    .attr("transform", `translate(0, ${timelineHeight - offsetY})`)
    .attr("class","axis")
    .style("border", "1px solid blue")
    .call(xAxis);

    // ⭐ 额外左端延长线
  timelineSvg.append("line")
    .attr("x1", offsetX - extraLeft * 2)
    .attr("x2", offsetX - extraLeft)
    .attr("y1", timelineHeight - offsetY)
    .attr("y2", timelineHeight - offsetY)
    .attr("stroke", "#333")
    .attr("stroke-width", 2);

  // ✅ 添加箭头线（在轴线最右端）
  const extraRight = 50;
  const xEnd = timelineWidth - offsetX + extraRight;
  axisGroup.append("line")
    .attr("x1", xScale(domain[0]))
    .attr("x2", xEnd)
    .attr("y1", 0)
    .attr("y2", 0)
    .attr("stroke", "#333")
    .attr("stroke-width", 2)
    .attr("marker-end", "url(#arrowhead)");

  axisGroup.selectAll("path.domain").remove(); // 移除默认轴线（我们自己画了）

  //clusters缩小
  shrinkClusters(clusterElsArray);

  // dropClustersToTimeline动画
  setTimeout(() => {
  dropSongsClustersToTimeline(containerRef, clusterElsArray, timelineSvg, titleLegendSvg, timelineOriginalP, songs, xScale, timelineHeight, offsetY, legend);
}, 1000);

  // ✅ 返回 context，供其他函数使用
  return {
    timelineSvg,
    releaseYear,
    xScale,
    timelineHeight,
    offsetY,
    legend,
    timelineWidth,
    offsetX,
    titleLegendSvg,
    title
  };
}
