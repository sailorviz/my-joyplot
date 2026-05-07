export function forClusterPosition(containerRef, clusterData, callback) {
  if (!containerRef?.current) return;

  const clusterKeys = Object.keys(clusterData).filter(k => k !== "Other"); // artists or albums，取决于传入的clusterData

  const gridCols = 6;
  const gridRows = Math.ceil(clusterKeys.length / gridCols);

    // 👇 减小这个系数来缩小横向间隔（原先是 1，可以改成 0.7 或 0.6）
  const horizontalCompression = 0.9;  // 调整这个值：越小横向间隔越小
  const gridWidth = (window.innerWidth * horizontalCompression) / gridCols;
  // const gridWidth = window.innerWidth / gridCols;
  const gridHeight = window.innerHeight / gridRows;

  clusterKeys.forEach((artist, clusterIndex) => {
    const data = clusterData[artist]; // 在album章节中，这里的artist指的是album

    const col = clusterIndex % gridCols;
    const row = Math.floor(clusterIndex / gridCols);

    // const clusterCenterX = col * gridWidth + gridWidth/6;
    // const clusterCenterY = row * gridHeight + gridHeight/2;
    // const clusterOpacity = Math.random() * 0.5 + 0.5;
    // 👇 还需要调整 X 的起始偏移，让整体居中
    const totalWidth = gridWidth * gridCols;
    const startX = (window.innerWidth - totalWidth) / 2;
    const clusterCenterX = startX + col * gridWidth + gridWidth/6;
    const clusterCenterY = row * gridHeight + gridHeight/2;
    const clusterOpacity = Math.random() * 0.5 + 0.5;
    
    callback({ artist, data, clusterCenterX, clusterCenterY, clusterIndex, clusterOpacity });
  });
}
