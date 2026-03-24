import { animateCluster } from "../top30Artists/animateCluster";
import { addRemainingSongs } from "./addRemainingSongs";
import { clusteringData } from "./clusteringData";

export function triggerClusteringByAlbum(containerRef, allSongs) {
  const clusterData = clusteringData(containerRef.current, allSongs);
  animateCluster(containerRef, clusterData);
  addRemainingSongs(containerRef, clusterData);
}
