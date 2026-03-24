export function forClusterPosition(containerRef, clusterData, callback) {
  if (!containerRef?.current) return;

  const clusterKeys = Object.keys(clusterData).filter(k => k !== "Other"); // artists or albums，取决于传入的clusterData

  const gridCols = 6;
  const gridRows = Math.ceil(clusterKeys.length / gridCols);

  const gridWidth = window.innerWidth / gridCols;
  const gridHeight = window.innerHeight / gridRows;

  clusterKeys.forEach((artist, clusterIndex) => {
    const data = clusterData[artist]; // 在album章节中，这里的artist指的是album

    const col = clusterIndex % gridCols;
    const row = Math.floor(clusterIndex / gridCols);

    // const clusterCenterX = col * gridWidth + gridWidth/6 + (Math.random()-0.5) * 50;
    // const clusterCenterY = row * gridHeight + gridHeight/2 + (Math.random()-0.5) * 50;
    const clusterCenterX = col * gridWidth + gridWidth/6;
    const clusterCenterY = row * gridHeight + gridHeight/2;

    // const clusterOpacity = minOpacity + (data.displayedSongs.length + data.remainingSongs.length) / maxSongsInAnyCluster * (maxOpacity - minOpacity);
    const clusterOpacity = Math.random() * 0.5 + 0.5;
    
    callback({ artist, data, clusterCenterX, clusterCenterY, clusterIndex, clusterOpacity });
  });
}
