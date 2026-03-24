
import * as d3 from "d3";
import { kernelGaussianForPopularity } from "../../../components/kernelGaussianForPopularity";
import { kernelDensityEstimatorForPopularity } from "../../../components/kernelDensityEstimatorForPopularity";
import { updateLegend } from "../../../components/updateLegend";

export function drawPopularityDensity(
  songs,
  svg,
  yScale,        // yScale.domain may be [-20,100], but KDE uses 0..100
  legend,
  axisX,
) {
  const xPosition = axisX + 20;
  const color = "steelblue";
  const bandwidth = 8;

  // 清洗数据
  const dataPopularity = songs
    .map(d => d.popularity)
    .filter(v => v != null && !isNaN(v));

  if (!dataPopularity.length) {
    console.warn("drawPopularityDensity: no valid popularity values");
    return {
      show() { /* noop */ },
      hide() { /* noop */ }
    };
  }

  // container
  let group = svg.select(".popularity-kde-group");
  if (group.empty()) group = svg.append("g").attr("class", "popularity-kde-group");

  // Compute KDE data on fixed [0,100] domain
  const kde = kernelDensityEstimatorForPopularity(
    kernelGaussianForPopularity(bandwidth),
    bandwidth,
    dataPopularity,
    { yMin: 0, yMax: 100, step: 1 }
  );

  const densityMax = d3.max(kde, d => d[1]) || 0.000001;
  const xScaleDensity = d3.scaleLinear()
    .domain([0, densityMax])
    .range([0, 100]);

  const densityLine = d3.line()
    .curve(d3.curveBasis)
    .x(d => xPosition + xScaleDensity(d[1]))
    .y(d => yScale(d[0]));

  const densityArea = d3.area()
    .curve(d3.curveBasis)
    .x0(xPosition)
    .x1(d => xPosition + xScaleDensity(d[1]))
    .y(d => yScale(d[0]));

  // draw area & line
  group.selectAll(".kde-area")
    .data([kde])
    .join("path")
    .attr("class", "kde-area")
    .attr("fill", color)
    .attr("opacity", 0.22)
    .attr("d", densityArea);

  group.selectAll(".kde-line")
    .data([kde])
    .join("path")
    .attr("class", "kde-line")
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("stroke", color)
    .attr("d", densityLine);

  return {
    show() {
      group.attr("display", null);
      if (legend) updateLegend(legend, "kde");
    },
    hide() {
      group.attr("display", "none");
      if (legend) updateLegend(legend, "songs");
    },

      // ↓↓↓ 新增内容 ↓↓↓
  kdeTop50: kde,
  xScaleDensity50: xScaleDensity,
  groupTop50: group
  };
}

