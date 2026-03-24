import * as d3 from "d3";

export function clusterTimezoneOfAlbum(clusterElsMap, timelineSvg, xScale, ticks, albumInfos, containerRef) {
  // ====== Data ======
  const bands = [
    { name: "Early", range: [new Date(0, 0, 1), new Date(1983, 11, 31)], color: "#eee" },
    { name: "MainBand", range: [new Date(1984, 0, 1), new Date(2009, 11, 31)], color: "#eef" },
    { name: "Modern", range: [new Date(2010, 0, 1), new Date(2024, 11, 31)], color: "#def" },
  ];

  const boundaries = [
  new Date(1984, 0, 1),
  new Date(2010, 0, 1)
  ];

  //重绘x-axis
  //更改ticks
  ticks.push(boundaries[0]);
  ticks.sort((a,b)=>a-b);

  //重新定义坐标轴
  const xAxis = d3.axisBottom(xScale)
    .tickValues(ticks)
    .tickFormat(d3.timeFormat("%Y"))
    .tickSize(6);
  //重新绘制坐标轴
  const axisGroup = timelineSvg.select("g.axis");//返回D3 selection（选择集）
  axisGroup
    .call(xAxis)
    .call(g => g.selectAll(".tick text")
      .style("font-weight", d => boundaries.some(b => +b === +d) ? "bold" : "normal")
      .style("fill", d => boundaries.some(b => +b === +d) ? "#666" : "#333")
      .attr("y", d => boundaries.some(b => +b === +d) ? 25 : 10) // ✅ 将文字下移 20 像素
      .style("font-size", d => boundaries.some(b => +b === +d) ? 18 : 12));

  // ====== 绘制分界线 ======
  // 然后获取位置信息
  const gNode = axisGroup.node();//将D3 selection转换为dom元素
  const gMatrix = gNode.getCTM(); // 获取元素相对于 SVG 的变换矩阵
  const dividerY1 = gMatrix.f;
  const dividerHeight = 230;
  timelineSvg.selectAll(".divider")
    .data(boundaries)
    .join("line")
    .attr("x1", d => xScale(d))
    .attr("x2", d => xScale(d))
    .attr("y1", dividerY1 + 18)
    .attr("y2", dividerY1 - dividerHeight)
    .attr("stroke", "#888")
    .attr("stroke-width", 3)
    .attr("stroke-dasharray", "3,3")
    .attr("opacity", 0.7);

  // ====== Clusters (circles) ======
  Object.entries(clusterElsMap).forEach(([album, cluster]) => {
    const releaseYear = albumInfos[album].release_year; //number
    const releaseYearDate = new Date(releaseYear, 0, 1); //date

    // 找出该 cluster 属于哪个 band
    const band = bands.find(b => 
      releaseYearDate >= b.range[0] && releaseYearDate <= b.range[1]
    );
    if (band) {
      cluster.dataset.band = band.name;  // 存入 dataset
    } else {
      cluster.dataset.band = "Unknown";  // 不在任何 band
    }

    if(album === "Doo-Wops & Hooligans"){
      console.log(band);
    }
    
    // 获取bandRange端点相对于视口的位置
    const timelineSvgRect = timelineSvg.node().getBoundingClientRect();
    const bandLeft = band.range[0];
    const bandRight = band.range[1];
    const bandLeftX = xScale(bandLeft) + timelineSvgRect.left;
    const bandRightX = xScale(bandRight) + timelineSvgRect.left;

    // 获取cluster两端相对于视口的位置
    const clusterRect = cluster.getBoundingClientRect();
    const clusterLeftX = clusterRect.left;
    const clusterRightX = clusterRect.right;
    // const clusterRightX = clusterRect.right + window.innerWidth/88;
    // 待优化：clusterRightX的有问题，但我暂时找不到原因，只能在视觉上硬编码一下

    // 判断x方向位置偏移
    let distanceX = 0;
    if (clusterLeftX < bandLeftX) {
      distanceX = bandLeftX - clusterLeftX;
    } else if (clusterRightX > bandRightX) {
      distanceX = bandRightX - clusterRightX;
    } 

    const prevTx = parseFloat(cluster.dataset.dropTx) || 0;
    const wholeDistanceX = prevTx + distanceX;
    const wholeDistanceY = (parseFloat(cluster.dataset.dropTy) || 0);
    cluster.style.transform = `translate(${wholeDistanceX}px, ${wholeDistanceY}px) scale(0.3)`;
    cluster.dataset.state = "cluster";
    cluster.dataset.clusterTx = wholeDistanceX;
    cluster.dataset.clusterTy = wholeDistanceY;
  });

  // 改变 tooltip 状态（改变元素的位置）
  const tooltip = containerRef.current.querySelector(".album-tooltip");
  const rect = containerRef.current.getBoundingClientRect();

  Object.entries(clusterElsMap).forEach(([album, cluster]) => {
    const tx = parseFloat(cluster.dataset.clusterTx) || 0;
    const ty = parseFloat(cluster.dataset.clusterTy) || 0;
    const releaseYear = albumInfos[album].release_year; //number
    cluster.style.pointerEvents = "auto"; // 🔓 允许交互

    // 清除旧事件监听
    cluster.onmouseenter = null;
    cluster.onmousemove = null;
    cluster.onmouseleave = null;

    if (!cluster._handlers) cluster._handlers = {};

    // 只初始化一次 cluster 原始事件, 里面的变量的值都是固定值（除了event)，所有只初始化一次works
    const clusterMouseEnter = (e) => {
      if (cluster.dataset.state !== "cluster") return;
      cluster.style.transform = `translate(${tx}px, ${ty}px) scale(0.35)`;
      // const topArtist = cluster.dataset.topArtist;
      // if (topArtist && topArtist === 1) {
      //   cluster.style.transform = `translate(${tx}px, ${ty}px) scale(1.8)`;
      // } else {
      //   cluster.style.transform = `translate(${tx}px, ${ty}px) scale(0.35)`;
      // }

      tooltip.innerHTML = `<strong>${album}</strong><br>Year: ${releaseYear}`;
      tooltip.style.left = `${e.clientX - rect.left + 10}px`;
      tooltip.style.top = `${e.clientY - rect.top - 40}px`;
      tooltip.style.opacity = 1;
    };
    const clusterMouseMove = (e) => {
      tooltip.style.left = `${e.clientX - rect.left + 10}px`;
      tooltip.style.top = `${e.clientY - rect.top - 40}px`;
    };
    const clusterMouseLeave = () => {
      if (cluster.dataset.state !== "cluster") return;
      cluster.style.transform = `translate(${tx}px, ${ty}px) scale(0.3)`;
      // const topArtist = cluster.dataset.topArtist;
      // if (topArtist && topArtist === 1) {
      //   cluster.style.transform = `translate(${tx}px, ${ty}px) scale(1.5)`;
      // } else {
      //   cluster.style.transform = `translate(${tx}px, ${ty}px) scale(0.3)`;
      // }
      tooltip.style.opacity = 0;
    };

    // 保存引用
    cluster._handlers.cluster = {
      mouseenter: clusterMouseEnter,
      mousemove: clusterMouseMove,
      mouseleave: clusterMouseLeave
    };

    // 先移除（保险），再绑定
    cluster.removeEventListener("mouseenter", clusterMouseEnter);
    cluster.removeEventListener("mousemove", clusterMouseMove);
    cluster.removeEventListener("mouseleave", clusterMouseLeave);
    cluster.addEventListener("mouseenter", clusterMouseEnter);
    cluster.addEventListener("mousemove", clusterMouseMove);
    cluster.addEventListener("mouseleave", clusterMouseLeave);
  });
}