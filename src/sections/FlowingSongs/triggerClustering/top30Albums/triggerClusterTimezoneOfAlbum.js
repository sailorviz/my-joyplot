import { clusterTimezoneOfAlbum } from "./clusterTimezoneOfAlbum";

export function triggerClusterTimezoneOfAlbum(context, albumInfos, containerRef) {
  const { clusterElsMap, timelineSvg, xScale, ticks } = context;
  if (!timelineSvg) {
    console.warn("Timeline SVG not found. Did you call triggerPlottingTimeline() first?");
    return;
  }

  clusterTimezoneOfAlbum(clusterElsMap, timelineSvg, xScale, ticks, albumInfos, containerRef);
}