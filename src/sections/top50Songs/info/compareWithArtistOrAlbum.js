
import * as d3 from "d3";

export function compareWithArtistOrAlbum(containerRef, songs, timelineSvg, timelineHeight, offsetY, xScale) {
  // 定义 boundaries 数据
  const artistBoundaries = [
    new Date(1969, 0, 1),
    new Date(1998, 0, 1),
    new Date(2010, 0, 1),
    new Date(2019, 0, 1)
  ];

  const albumBoundaries = [
    new Date(1984, 0, 1),
    new Date(2010, 0, 1)
  ];

  const artistConcentratedBands = [
    { name: "1969 - 1998", range: [new Date(1969, 0, 1), new Date(1998, 0, 1)], color: "steelblue" },
    { name: "2010 - 2019", range: [new Date(2010, 0, 1), new Date(2019, 0, 1)], color: "steelblue" },
  ];

  const albumConcentratedBands = [
    { name: "Before 1984", range: [new Date(1963, 0, 1), new Date(1984, 0, 1)], color: "steelblue" },
    { name: "After 2010", range: [new Date(2010, 0, 1), new Date(2025, 10, 28)], color: "steelblue" },
  ];

  let boundaries = [];
  let bandsData = []; // ⭐ 新增：当前要绘制的 bands 数据

  // 绘制 boundaries 的函数
  function renderBoundaries() {
    const dividers = timelineSvg.selectAll(".boundaries")
      .data(boundaries, d => d);

    dividers.join(
      enter => enter.append("line")
        .attr("class", "boundaries")
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d))
        .attr("y1", timelineHeight - offsetY - 140)
        .attr("y2", timelineHeight - offsetY + 20)
        .attr("stroke", "lightGray")
        .attr("stroke-width", 5)
        .attr("stroke-dasharray", "6,2")
        .style("opacity", 1),
      update => update
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d)),
      exit => exit.remove()
    );
  }

  // ⭐ 新增：绘制集中带（bands）
  // function renderBands() {
  //   const bands = timelineSvg.selectAll(".concentrated-band")
  //     .data(bandsData, d => d.name);

  //   bands.join(
  //     enter => enter.append("rect")
  //       .attr("class", "concentrated-band")
  //       .attr("x", d => xScale(d.range[0]))
  //       .attr("y", timelineHeight - offsetY - 140)
  //       .attr("width", d => xScale(d.range[1]) - xScale(d.range[0]))
  //       .attr("height", 160)
  //       .attr("fill", d => d.color)
  //       .attr("opacity", 0.12),
  //     update => update
  //       .attr("x", d => xScale(d.range[0]))
  //       .attr("width", d => xScale(d.range[1]) - xScale(d.range[0])),
  //     exit => exit.remove()
  //   );

  //   timelineSvg.select(".axis").raise();
  // }
  // ⭐ 在现有 bands rect 之外，另建一层 label
  function renderBands() {
    const bands = timelineSvg.selectAll(".concentrated-band")
      .data(bandsData, d => d.name);

    // 绘制矩形 bands
    bands.join(
      enter => enter.append("rect")
        .attr("class", "concentrated-band")
        .attr("x", d => xScale(d.range[0]))
        .attr("y", timelineHeight - offsetY - 140)
        .attr("width", d => xScale(d.range[1]) - xScale(d.range[0]))
        .attr("height", 160)
        .attr("fill", d => d.color)
        .attr("opacity", 0.12),
      update => update
        .attr("x", d => xScale(d.range[0]))
        .attr("width", d => xScale(d.range[1]) - xScale(d.range[0])),
      exit => exit.remove()
    );

    // 绘制 bands 的文字标签（居中）
    const labels = timelineSvg.selectAll(".band-label")
      .data(bandsData, d => d.name);

    labels.join(
      enter => enter.append("text")
        .attr("class", "band-label")
        .attr("x", d => xScale(d.range[0]) + (xScale(d.range[1]) - xScale(d.range[0])) / 2)
        .attr("y", timelineHeight - offsetY - 140 + 30)
        .text(d => d.name)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "20px")
        .style("font-weight", 500)
        .style("fill", "white")
        .style("pointer-events", "none"),   // 避免遮挡 hover
      update => update
        .attr("x", d => xScale(d.range[0]) + (xScale(d.range[1]) - xScale(d.range[0])) / 2)
        .attr("y", timelineHeight - offsetY - 140 + 160 / 2),
      exit => exit.remove()
    );

    // 保证 axis 在最上层
    timelineSvg.select(".axis").raise();
  }

  // 更新 songs 样式
  function updateSongStyles(compareType) {
    const clusterEls = containerRef.current.querySelectorAll(".top50-songs");
    clusterEls.forEach(el => {
      const id = el.dataset.id;
      const song = songs[id];
      const ifTopArtist = Number(song.if_top30artists);
      const ifTopAlbum = Number(song.if_top30albums);

      if (compareType === "artist" && ifTopArtist === 1) {
        el.style.background = "green";
        el.style.zIndex = 9999;
        el.dataset.compareStatus = "artist";
      } else if (compareType === "album" && ifTopAlbum === 1) {
        el.style.background = "green";
        el.style.zIndex = 9999;
        el.dataset.compareStatus = "album";
      } else {
        el.style.background = "orange";
        el.style.zIndex = 999;
        el.dataset.compareStatus = "";
      }
    });
  }

  // 返回操作接口
  return {
    compareWithArtist: () => {
      boundaries = artistBoundaries;
      bandsData = artistConcentratedBands;   // ⭐ 新增

      updateSongStyles("artist");
      renderBoundaries();
      renderBands();                         // ⭐ 新增
    },

    compareWithAlbum: () => {
      boundaries = albumBoundaries;
      bandsData = albumConcentratedBands;    // ⭐ 新增

      updateSongStyles("album");
      renderBoundaries();
      renderBands();                         // ⭐ 新增
    },

    reset: () => {
      boundaries = [];
      bandsData = [];                         // ⭐ 清空 bands

      renderBoundaries();
      renderBands();                          // ⭐ 清空绘制
      updateSongStyles("");
    }
  };
}
