export function treemapToGenreCompare(type, container){
  const clusterElsNodeList = container.querySelectorAll(".top50-songs");
  const clusters = Array.from(clusterElsNodeList);
  clusters.forEach(el => {
    el.style.opacity = 1;
    el.style.pointerEvents = "auto";
  })
  
  const treemap = container.querySelector(`.${type}-treemap`);
  if (treemap) treemap.remove();
}