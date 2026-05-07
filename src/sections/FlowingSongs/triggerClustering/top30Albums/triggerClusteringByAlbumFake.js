import { animateCluster } from "../top30Artists/animateCluster";
import { addRemainingSongs } from "./addRemainingSongs";
import { clusteringData } from "./clusteringData";

export function triggerClusteringByAlbumFake(containerRef, allSongs) {
  const clusterData = clusteringData(containerRef.current, allSongs);

  addRemainingSongs(containerRef, clusterData);
}
