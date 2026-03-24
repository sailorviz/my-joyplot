import * as d3 from "d3";
import { kernelGaussian } from "../../../components/kernelGaussian";
import { kernelDensityEstimator } from "../../../components/kernelDensityEstimator";
import { updateLegend } from "../../../components/updateLegend";

export function drawReleaseYearDensity(svg, releaseYears, xScale, timelineHeight, offsetY, legend) {
  if (!releaseYears || releaseYears.length === 0) return;

  // KDE 计算
  const kde = kernelDensityEstimator(kernelGaussian(0.3), xScale, releaseYears);

  // y-scale（密度值自动归一化）
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(kde, d => d[1])])
    .range([timelineHeight - offsetY, timelineHeight - offsetY - 80]); // 密度图高度

  // 线条 path
  const line = d3.line()
    .curve(d3.curveBasis)
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]));

  let densityPath = svg.select(".release-density");
  let densityArea = svg.select(".release-density-area");
  let focusLine = svg.select(".release-focus-line");
  let focus = svg.select(".release-focus-circle");
  let tooltip = d3.select("body").select(".density-tooltip");

    // 如果不存在则创建
  if (densityPath.empty()) {
    densityPath = svg.append("path")
      .attr("class", "release-density")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("opacity", 0); // 默认隐藏
  }

  if (densityArea.empty()) {
    densityArea = svg.append("path")
      .attr("class", "release-density-area")
      .attr("fill", "steelblue")
      .attr("opacity", 0); // 默认隐藏
  }

  if (focusLine.empty()) {
    focusLine = svg.append("line")
      .attr("class", "release-focus-line")
      .attr("stroke", "lightGray")
      .attr("stroke-width", 1)
      .attr("y1", timelineHeight - offsetY - 140)
      .attr("y2", timelineHeight - offsetY + 20)
      .attr("stroke-dasharray", "4,1.5")
      .style("opacity", 0);
  }

  if (focus.empty()) {
    focus = svg.append("circle")
      .attr("class", "release-focus-circle")
      .attr("r", 3)
      .attr("fill", "white")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .style("opacity", 0);
  }

  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "density-tooltip")
      .style("position", "absolute")
      .style("padding", "6px 10px")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "6px")
      .style("font-size", "14px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  }

  // -------------------------------
  // 更新 KDE 曲线和面积（每次调用都更新）
  // -------------------------------
  densityPath
    .datum(kde)
    .attr("d", line)
    .style("opacity", 1);

  densityArea
    .datum(kde)
    .attr("d",
      d3.area()
        .curve(d3.curveBasis)
        .x(d => xScale(d[0]))
        .y0(timelineHeight - offsetY)
        .y1(d => yScale(d[1]))
    )
    .style("opacity", 0.2);

  updateLegend(legend, "kde");

  // 统计每年歌曲数量
  const countByYear = d3.rollup(
    releaseYears,
    v => v.length,
    d => d.getFullYear()
  );

  svg.on("mousemove", (event) => {
    let [mouseX] = d3.pointer(event);

    // 限制 mouseX 在 KDE 范围内
    mouseX = Math.max(xScale(kde[0][0]), Math.min(mouseX, xScale(kde[kde.length - 1][0])));

    const x0 = xScale.invert(mouseX);
    const i = d3.bisector(d => d[0]).left(kde, x0, 1);

    const d0 = kde[i - 1] || kde[0];
    const d1 = kde[i] || kde[kde.length - 1];

    // 选择最近的点
    const d = x0 - d0[0] > d1[0] - x0 ? d1 : d0;

    const year = d[0].getFullYear();
    // const density = d[1].toFixed(3);
    const count = countByYear.get(year) || 0;

    // 更新focus的位置
    // 获取 path 节点
    const pathNode = densityPath.node();

    // 获取整条曲线的长度
    const totalLength = pathNode.getTotalLength();

    // 根据当前 x（使用 d[0]）反推曲线上对应的长度
    const targetX = xScale(d[0]);

    // ⚠️ lineLengthX: 找到 path 上 x 最接近 targetX 的位置
    let precision = 5;
    let best, bestLength, bestDist = Infinity;

    for (let scan = 0; scan <= totalLength; scan += precision) {
      const pt = pathNode.getPointAtLength(scan);
      const dist = Math.abs(pt.x - targetX);
      if (dist < bestDist) {
        best = pt;
        bestLength = scan;
        bestDist = dist;
      }
    }

    // 更新 vertical line 位置
    focusLine
      .attr("x1", xScale(d[0]))
      .attr("x2", xScale(d[0]))
      .style("opacity", 1);

    // 让 focus 点贴到曲线上真实的位置
    focus
      .attr("cx", best.x)
      .attr("cy", best.y)
      .style("opacity", 1);

    // tooltip
    tooltip
      .style("opacity", 1)
      .html(`<strong>${year}</strong><br/>Songs: ${count}`)
      .style("left", (event.pageX + 12) + "px")
      .style("top", (event.pageY - 28) + "px");
  });

  svg.on("mouseleave", () => {
    focusLine.style("opacity", 0);
    tooltip.style("opacity", 0);
  });

    // ---------- 返回控制接口 ----------
  return {
    hide: () => {
      svg.style("pointer-events", "none");
      densityPath.style("opacity", 0);
      densityArea.style("opacity", 0);
      focusLine.style("opacity", 0);
      focus.style("opacity", 0);
      tooltip.style("opacity", 0);
    },
    show: () => {
      densityPath.style("opacity", 1);
      densityArea.style("opacity", 0.2);
      svg.style("pointer-events", "auto");
    }
  };
}

// 元素只创建一次，然后返回控制接口。这个方法值得继续使用！！！
