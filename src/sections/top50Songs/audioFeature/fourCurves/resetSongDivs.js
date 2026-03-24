export function resetSongDivs(container) {
  const songDivs = container.querySelectorAll(".four-curves-songs");
  if (songDivs) {
    songDivs.forEach(div => {
      div.style.display = "none";
    });
  }
  // nodelist 不是一个dom 对象，不能直接使用.remove(), 但是可以迭代，使用foreach() or for(const node of nodelist){}
}
