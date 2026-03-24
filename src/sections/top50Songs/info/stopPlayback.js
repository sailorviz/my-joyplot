export function stopPlayback(audioPlayer, currentCluster) {
  if (!currentCluster) return null;

  audioPlayer.pause();
  audioPlayer.currentTime = 0;

  // 恢复 cluster 状态
  currentCluster.dataset.audioStatus = "idle";
  currentCluster.classList.remove("playing-highlight");
  currentCluster.style.transform = "scale(1)";

  return null; // parent 覆盖 currentCluster
}
