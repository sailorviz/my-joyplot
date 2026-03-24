export function backToMap(containerRef, MAX_VISIBLE){
  const children = Array.from(containerRef.current.children);
  const mapSVG = containerRef.current.querySelector(".map");
  const artistImages = containerRef.current.querySelectorAll(".clusterForArtist");
  const artistImagesArray =  Array.from(artistImages);

  children.slice(0, MAX_VISIBLE).forEach(el => {
    el.style.opacity = 0;
    el.style.pointerEvents = "none"; // 防止透明层阻挡点击
  });

  mapSVG.style.opacity = 1;
  artistImagesArray.forEach(cluster => {
    cluster.style.opacity = 1;
    cluster.style.pointerEvents = "auto";
  });
}