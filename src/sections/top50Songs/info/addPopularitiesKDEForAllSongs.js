import * as d3 from "d3";
import Papa from "papaparse";
import { kernelGaussianForPopularity } from "../../../components/kernelGaussianForPopularity";
import { kernelDensityEstimatorForPopularity } from "../../../components/kernelDensityEstimatorForPopularity";
import { updateLegend } from "../../../components/updateLegend";

export function addPopularitiesKDEForAllSongs(svg, yScale, legend, axisX, 
  kdeTop50,
  xScaleDensity50,
  groupTop50){

  const xPosition = axisX + 20;
  const color = "orange";
  const bandwidth = 8;
  svg.raise();

  // 创建交互层
  let overlay = svg.select(".popularity-kde-overlay");
  if (overlay.empty()) {
    overlay = svg.append("rect")
      .attr("class", "popularity-kde-overlay")
      .attr("x", xPosition - 20)
      .attr("y", yScale(100))
      .attr("width", 1000)
      .attr("height", yScale(0) - yScale(100))
      .attr("fill", "none")
      .style("pointer-events", "all")
  }

  let focusLine = svg.select(".popularity-kde-focus-line");
  if (focusLine.empty()) {
    focusLine = svg.append("line")
      .attr("class", "popularity-kde-focus-line")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,1.5")
      .attr("opacity", 0);
  }

  // focus circles 
  let circle50 = groupTop50.select(".focus-circle-50");
  if (circle50.empty()) {
    circle50 = groupTop50.append("circle")
      .attr("class", "focus-circle-50")
      .attr("r", 4)
      .attr("fill", "#fff")
      .attr("stroke", "#fff")
      .attr("opacity", 0);
  }

  let circleAll = svg.select(".focus-circle-all");
  if (circleAll.empty()) {
    circleAll = svg.append("circle")
      .attr("class", "focus-circle-all")
      .attr("r", 4)
      .attr("fill", "orange")
      .attr("stroke", "#fff")
      .attr("opacity", 0);
  }

  // tooltip
  let tooltip = d3.select(".popularity-kde-tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "popularity-kde-tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "rgba(0,0,0,0.7)")
      .style("padding", "6px 10px")
      .style("border-radius", "4px")
      .style("color", "#fff")
      .style("font-size", "12px")
      .style("opacity", 0);
  }

  fetch("/data/2296_all_songs.csv")
    .then(res => res.text())
    .then(csvText => {
      const result = Papa.parse(csvText, { header: true });
      const allSongsPop = result.data
        .map(row => +row.song_popularity)
        .filter(v => !isNaN(v));

      if (!allSongsPop.length) return;

      // container
      let group = svg.select(".all-popularity-kde-group");
      if (group.empty()) group = svg.append("g").attr("class", "all-popularity-kde-group");

      const kde = kernelDensityEstimatorForPopularity(
        kernelGaussianForPopularity(bandwidth),
        bandwidth,
        allSongsPop,
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

      group.selectAll(".all-kde-area")
        .data([kde])
        .join("path")
        .attr("class", "all-kde-area")
        .attr("fill", color)
        .attr("opacity", 0.22)
        .attr("d", densityArea);

      group.selectAll(".all-kde-line")
        .data([kde])
        .join("path")
        .attr("class", "all-kde-line")
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("stroke", color)
        .attr("d", densityLine);

      // 绑定交互层
      overlay
        .on("mousemove", (event) => {
          event.stopPropagation();  // 阻止冒泡
          const [, my] = d3.pointer(event);
          const popularity = Math.max(0, Math.min(100, yScale.invert(my)));

          const p = Math.round(popularity);

          const d50 = kdeTop50[p];
          const dAll = kde[p];

          // 更新 focus line
          focusLine
            .attr("x1", xPosition - 20)
            .attr("x2", xPosition + 200)
            .attr("y1", yScale(p))
            .attr("y2", yScale(p))
            .attr("opacity", 1)
            .raise();

          // circle 50
          if (d50) {
            circle50
              .attr("cx", xPosition + xScaleDensity50(d50[1]))
              .attr("cy", yScale(p))
              .attr("opacity", 1)
              .raise();
          } else {
            circle50.attr("opacity", 0);
          }

          // circle ALL
          if (dAll) {
            circleAll
              .attr("cx", xPosition + xScaleDensity(dAll[1]))
              .attr("cy", yScale(p))
              .attr("opacity", 1)
              .raise();
          }

          // tooltip
          tooltip
            .style("opacity", 1)
            .style("left", event.pageX + 15 + "px")
            .style("top", event.pageY + 15 + "px")
            .html(`
              <div>Popularity: <b>${p}</b></div>
              <div>Top50 songs density: ${d50 ? d50[1].toFixed(4) : "-"}</div>
              <div>All songs density: ${dAll[1].toFixed(4)}</div>
            `);
        })
        .on("mouseout", () => {
          focusLine.attr("opacity", 0);
          circle50.attr("opacity", 0);
          circleAll.attr("opacity", 0);
          tooltip.style("opacity", 0);
        });
    })
    .catch(err => console.error(err));

  return {
    show() {
      svg.select(".all-popularity-kde-group").attr("display", null);
      if (legend) updateLegend(legend, "kdeOfTwo");
      overlay?.style("pointer-events", "all");
    },
    hide() {
      overlay?.style("pointer-events", "none");
      svg.select(".all-popularity-kde-group").attr("display", "none");
      if (legend) updateLegend(legend, "kde");
    }
  };
}


