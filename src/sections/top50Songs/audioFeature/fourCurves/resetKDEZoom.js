import * as d3 from "d3";

export function resetKDEZoom(container) {
  const grid = container.querySelector(".kde-grid");
  if (!grid) return;

  // song divs 回到初始位置，且隐藏显示
  const songDivs = container.querySelectorAll(".four-curves-songs");
  if (songDivs) {
    songDivs.forEach(div => {
      div.style.left = "0px";
      div.style.top = "0px";
      div.style.display = "none";
    });
  }

  // 先全局隐藏 axis，防止残留
  d3.selectAll(".x-axis").interrupt().style("opacity", 0);

  // 遍历所有 KDE card
  grid.querySelectorAll(".kde-card").forEach(card => {
    // 中断旧 transition
    card.style.transition = "none";
    // 恢复 transform & opacity
    card.style.transform = "translate(0, 0) scale(1)";
    card.style.opacity = 1;
    card.style.zIndex = 1;
    
    // title 隐藏
    const title = card.querySelector(".kde-card-title");
    if (title) {
      title.style.transition = "none";
      title.style.opacity = 0;
    }

    // 添加过渡效果
    setTimeout(() => {
      card.style.transition = "transform 0.6s ease, opacity 0.4s ease";
    }, 10);
  });
}

