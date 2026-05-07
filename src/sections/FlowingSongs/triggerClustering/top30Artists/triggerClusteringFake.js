import { animateCluster } from "./animateCluster";
import { addRemainingSongs } from "./addRemainingSongs";
import { clusteringData } from "./clusteringData";

export function triggerClusteringFake(containerRef, allSongs) {
  const clusterData = clusteringData(containerRef.current, allSongs);

  addRemainingSongs(containerRef, clusterData);
}
