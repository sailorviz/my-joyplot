import { compareWithArtistOrAlbum } from "./compareWithArtistOrAlbum";
import { updateLegend } from "../../../components/updateLegend";

export function triggerCompareWithAlbum(containerRef, songs, context) {
  const { timelineSvg, releaseYear, xScale, timelineHeight, offsetY, legend } = context;
  if (!timelineSvg) {
    console.warn("Timeline SVG not found. Did you call triggerPlottingTimeline() first?");
    return;
  }
  console.log("triggerCompareWithArtist is triggering...")
  const comparator = compareWithArtistOrAlbum(containerRef, songs, timelineSvg, timelineHeight, offsetY, xScale);

  // 对比 artist
  // 回滚
  comparator.reset();
  comparator.compareWithAlbum();
  updateLegend(legend, "songsWithAlbum");
}