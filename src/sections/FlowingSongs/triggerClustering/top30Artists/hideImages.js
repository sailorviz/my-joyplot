export function hideImages(container){
  const clusterEls = Array.from(container.children)
    .filter(c => c.classList.contains("clusterForArtist"));

  if (clusterEls.length === 0) return;

  clusterEls.forEach(el => {
    el.style.transition = "all 0.5s ease";
    el.style.opacity = 0;
    el.style.pointerEvents = "none";
  });
}