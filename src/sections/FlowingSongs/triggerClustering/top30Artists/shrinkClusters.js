export function shrinkClusters(clusters) {
  const shrinkDuration = 1000;
  // 触发动画
  clusters.forEach(cluster => {
    cluster.dataset.state = "shrink"; // 🟦 添加状态
    // cluster.innerHTML = "";
    cluster.style.pointerEvents = "none";
    cluster.style.transition = `transform ${shrinkDuration}ms`;
    cluster.style.transform = `scale(0.3)`;
  });
}
