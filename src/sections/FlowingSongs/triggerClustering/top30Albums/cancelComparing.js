export function cancelComparing(container) {
  // 隐藏500 new cluster
  const newClusters = container.querySelectorAll(".albums500Greatest");
  newClusters.forEach(el => el.remove());

  // top30 cluster回到初始位置，hovering恢复
  const clusterEls = container.querySelectorAll(".clusterForAlbum");
  clusterEls.forEach(el => {
    Object.assign(el.style, {
      transform: "scale(1) translate(0,0)",
      filter: "none",
      opacity: "1",
      zIndex: "1",
      pointerEvents: "auto"
    });

    el.dataset.state = "initial";
    const hi = el._handlers.initial;
    const hc = el._handlers.comparing;
    el.removeEventListener("mouseenter", hc.mouseenter);
    el.removeEventListener("mousemove", hc.mousemove);
    el.removeEventListener("mouseleave", hc.mouseleave);
    el.addEventListener("mouseenter", hi.mouseenter);
    el.addEventListener("mousemove", hi.mousemove);
    el.addEventListener("mouseleave", hi.mouseleave);  
  });
}
