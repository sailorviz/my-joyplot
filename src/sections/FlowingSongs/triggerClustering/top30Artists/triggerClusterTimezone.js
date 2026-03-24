import {clusterTimezone} from "./clusterTimezone";

export function triggerClusterTimezone(context, artistInfos, containerRef) {
  const { clusterElsMap, timelineSvg, xScale, ticks } = context;
  if (!timelineSvg) {
    console.warn("Timeline SVG not found. Did you call triggerPlottingTimeline() first?");
    return;
  }

  clusterTimezone(clusterElsMap, timelineSvg, xScale, ticks, artistInfos, containerRef);
}