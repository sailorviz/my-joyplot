import * as d3 from "d3";
import { timeToIndex } from "./timeToIndex";

export function addZoomFrame({
  container,
  xScale,       // current xScale (shared with waveforms)
}) {

  const timeRange = {
    start : 0,
    duration : 60
  };
  const joyplotDiv = container.querySelector(".joyplot-div");
  const height = joyplotDiv.clientHeight;
  // --------------------------------------------------
  // 1. Ensure zoom-frame-layer exists (idempotent)
  // --------------------------------------------------
  const svg = d3.select(container).select(".left-panel").select(".joyplot-div").select(".joyplot-svg");

  let layer = svg.select("g.zoom-frame-layer");
  if (layer.empty()) {
    layer = svg.insert("g", ":first-child") // 🌟 放到最底下
      .attr("class", "zoom-frame-layer")
      .style("pointer-events", "none");
  }

  // --------------------------------------------------
  // 2. Convert time range → pixel range
  // --------------------------------------------------
  const startIndex = timeToIndex(timeRange.start);
  const endIndex   = timeToIndex(timeRange.start + timeRange.duration);

  const startX = xScale(startIndex);
  const endX   = xScale(endIndex);
  const frameWidth = endX - startX;

  // --------------------------------------------------
  // 3. Draw / update zoom frame rect
  // --------------------------------------------------

  let frameRect = layer.select("rect.zoom-frame");

  if (frameRect.empty()) {
    frameRect = layer.append("rect")
      .attr("class", "zoom-frame");
  }

  frameRect
    .attr("x", startX)
    .attr("y", 0)
    .attr("width", frameWidth)
    .attr("height", height)
    .style("opacity", 0)
    .style("pointer-events", "none");

  // --------------------------------------------------
  // 6. Return control handles (for step 2)
  // --------------------------------------------------

  return {
    /**
     * Update frame geometry when xScale changes
     * (this is what makes step 2 clean)
     */
    updateX(newXScale) {
      const newStartX = newXScale(startIndex);
      const newEndX   = newXScale(endIndex);
      const newWidth  = newEndX - newStartX;

      frameRect
        .attr("x", newStartX)
        .attr("width", newWidth);
    },

    updateLayout(svgArea) {
      frameRect
        .attr("y", 0)
        .attr("height", svgArea.height);
    },

    show() {
      frameRect.style("opacity", 1);
    },

    hide() {
      frameRect.style("opacity", 0);
    },

    remove() {
      layer.remove();
    }
  };
}