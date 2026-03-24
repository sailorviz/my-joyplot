import { drawMoodTreemap } from "./drawMoodTreemap";
import * as d3 from "d3";

export function sankeyChartToMoodTreemap(container){
  // 移除已有的 sankey
  d3.select(container).select(".sankey")?.remove();

  // hide timeline title&legend SVG
  const oldTitleLegend = d3.select(container).select(".songs-titleLegend");
  if (!oldTitleLegend.empty()) {
    oldTitleLegend.style("opacity", 0);
  }
  
  drawMoodTreemap(container);
}