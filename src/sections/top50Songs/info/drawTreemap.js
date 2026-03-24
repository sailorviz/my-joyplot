import * as d3 from "d3";

export function drawTreemap(type, data, colorMap, categoryColorMap, container) {
  const root = d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

  const totalValue = root.value;

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  d3.select(container).select(`.${type}-treemap`)?.remove();

  const treemapDiv = d3.select(container)
    .append("div")
    .attr("class", `${type}-treemap`)
    .style("position", "relative")
    .style("width", width + "px")
    .style("height", height + "px");

  const tooltip = d3.select(container)
    .append("div")
    .attr("class", "treemap-tooltip")
    .style("position", "absolute")
    .style("padding", "6px 10px")
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "white")
    .style("font-size", "12px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("z-index", 1000)
    .style("opacity", 0);

  const leafOffset = { left: 4, top: 20 }; // leaf 相对 category 偏移
  const leafPaddingInner = 2; // leaf 与 leaf 间距

  const hasCategoryLayer = root.children?.[0]?.children;

  if (hasCategoryLayer) {
    d3.treemap()
      .size([width, height])
      .paddingInner(10)(root);

    root.children.forEach(cat => {
      const catDiv = treemapDiv.append("div")
        .attr("class", "category-node")
        .style("position", "absolute")
        .style("left", cat.x0 + "px")
        .style("top", cat.y0 + "px")
        .style("width", (cat.x1 - cat.x0) + "px")
        .style("height", (cat.y1 - cat.y0) + "px")
        .style("background", categoryColorMap[cat.data.name] || "#aaa")
        .style("opacity", 1)
        .style("border-radius", "6px")
        .style("pointer-events", "none");

      catDiv.append("div")
        .attr("class", "category-label")
        .style("position", "absolute")
        .style("top", "4px")
        .style("left", "6px")
        .style("font-size", "13px")
        .style("font-weight", "bold")
        .style("color", "#fff")
        .style("pointer-events", "none")
        .text(cat.data.name);

      const catRoot = d3.hierarchy(cat.data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

      d3.treemap()
        .size([cat.x1 - cat.x0 - leafOffset.left, cat.y1 - cat.y0 - leafOffset.top])
        .paddingOuter(6)
        .paddingInner(leafPaddingInner)(catRoot);

      const leaves = catRoot.leaves();

      leaves.forEach(leaf => {
        const leafDiv = treemapDiv.append("div")
          .attr("class", "node")
          .style("position", "absolute")
          .style("left", cat.x0 + leaf.x0 + leafOffset.left + "px")
          .style("top", cat.y0 + leaf.y0 + leafOffset.top + "px")
          .style("width", (leaf.x1 - leaf.x0) + "px")
          .style("height", (leaf.y1 - leaf.y0) + "px")
          .style("background", colorMap[leaf.data.name] || "#ccc")
          .style("border-radius", "4px")
          .style("overflow", "hidden")
          .style("opacity", 0.7)
          .style("box-shadow", "0 1px 3px rgba(0,0,0,0.2)")
          .style("border", "1px solid #fff")
          .style("cursor", "pointer")
          .on("mouseenter", (event, d) => {
            const percent = ((leaf.value / totalValue) * 100).toFixed(1);
            tooltip.html(`${type}: ${leaf.data.name}<br>count: ${leaf.value}<br>percentage: ${percent}%`)
              .style("opacity", 1);
          })
          .on("mousemove", (event) => {
            const rect = container.getBoundingClientRect();
            const tooltipNode = tooltip.node();
            const tooltipWidth = tooltipNode.offsetWidth;
            const tooltipHeight = tooltipNode.offsetHeight;

            let left = event.clientX - rect.left + 10;
            let top = event.clientY - rect.top + 10;

            if (left + tooltipWidth > rect.width) left = rect.width - tooltipWidth - 5;
            if (top + tooltipHeight > rect.height) top = rect.height - tooltipHeight - 5;
            if (left < 0) left = 5;
            if (top < 0) top = 5;

            tooltip.style("left", left + "px").style("top", top + "px");
          })
          .on("mouseleave", () => tooltip.style("opacity", 0));

        leafDiv.append("div")
          .attr("class", "node-label")
          .style("position", "absolute")
          .style("top", "50%")
          .style("left", "50%")
          .style("transform", "translate(-50%, -50%)")
          .style("text-align", "center")
          .style("font-size", "14px")
          .style("color", "white")
          .style("pointer-events", "none")
          .html(`${leaf.data.name}<br>${leaf.data.value}`)
          .style("display", () => {
            const w = leaf.x1 - leaf.x0;
            const h = leaf.y1 - leaf.y0;
            return (w < 40 || h < 40) ? "none" : "block";
          });
      });
    });
  } else {
    d3.treemap()
      .size([width, height])
      .paddingInner(leafPaddingInner)(root);

    const leaves = root.leaves();

    leaves.forEach(leaf => {
      const leafDiv = treemapDiv.append("div")
        .attr("class", "node")
        .style("position", "absolute")
        .style("left", leaf.x0 + "px")
        .style("top", leaf.y0 + "px")
        .style("width", (leaf.x1 - leaf.x0) + "px")
        .style("height", (leaf.y1 - leaf.y0) + "px")
        .style("background", colorMap[leaf.data.name] || "#ccc")
        .style("border-radius", "4px")
        .style("border", "1px solid #fff")
        .style("overflow", "hidden")
        .style("box-shadow", "0 1px 3px rgba(0,0,0,0.2)")
        .style("cursor", "pointer")
        .on("mouseenter", (event, d) => {
          const percent = ((leaf.value / totalValue) * 100).toFixed(1);
          tooltip.html(`${type}: ${leaf.data.name}<br>count: ${leaf.value}<br>percentage: ${percent}%`)
            .style("opacity", 1);
        })
        .on("mousemove", (event) => {
          const rect = container.getBoundingClientRect();
          const tooltipNode = tooltip.node();
          const tooltipWidth = tooltipNode.offsetWidth;
          const tooltipHeight = tooltipNode.offsetHeight;

          let left = event.clientX - rect.left + 10;
          let top = event.clientY - rect.top + 10;

          if (left + tooltipWidth > rect.width) left = rect.width - tooltipWidth - 5;
          if (top + tooltipHeight > rect.height) top = rect.height - tooltipHeight - 5;
          if (left < 0) left = 5;
          if (top < 0) top = 5;

          tooltip.style("left", left + "px").style("top", top + "px");
        })
        .on("mouseleave", () => tooltip.style("opacity", 0));

      leafDiv.append("div")
        .attr("class", "node-label")
        .style("position", "absolute")
        .style("top", "50%")
        .style("left", "50%")
        .style("transform", "translate(-50%, -50%)")
        .style("text-align", "center")
        .style("font-size", "14px")
        .style("color", "white")
        .style("pointer-events", "none")
        .html(`${leaf.data.name}<br>${leaf.data.value}`)
        .style("display", () => {
          const w = leaf.x1 - leaf.x0;
          const h = leaf.y1 - leaf.y0;
          return (w < 40 || h < 40) ? "none" : "block";
        });
    });
  }

  // ----------------------------
  // Resize 优化（防抖 + 只更新位置尺寸）
  // ----------------------------
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      d3.select(container).select(`.${type}-treemap`)
        .style("width", width + "px")
        .style("height", height + "px");

      // 判断是否有 category 层
      const hasCategoryLayer = root.children?.[0]?.children;

      if (hasCategoryLayer) {
        // category 层和 leaf 层重新布局
        d3.treemap()
          .size([width, height])
          .paddingInner(10)(root);

        root.children.forEach(cat => {
          const catDiv = d3.select(treemapDiv.node().querySelector(`.category-node:nth-child(${root.children.indexOf(cat) + 1})`));
          catDiv
            .style("left", cat.x0 + "px")
            .style("top", cat.y0 + "px")
            .style("width", (cat.x1 - cat.x0) + "px")
            .style("height", (cat.y1 - cat.y0) + "px");

          const catRoot = d3.hierarchy(cat.data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

          d3.treemap()
            .size([cat.x1 - cat.x0 - leafOffset.left, cat.y1 - cat.y0 - leafOffset.top])
            .paddingInner(leafPaddingInner)(catRoot);

          const leaves = catRoot.leaves();
          leaves.forEach((leaf, i) => {
            const leafDiv = d3.select(treemapDiv.node().querySelectorAll(".node")[root.leaves().indexOf(leaf)]);
            leafDiv
              .style("left", cat.x0 + leaf.x0 + leafOffset.left + "px")
              .style("top", cat.y0 + leaf.y0 + leafOffset.top + "px")
              .style("width", (leaf.x1 - leaf.x0) + "px")
              .style("height", (leaf.y1 - leaf.y0) + "px");
          });
        });
      } else {
        // 两层数据重新布局
        d3.treemap()
          .size([width, height])
          .paddingInner(leafPaddingInner)(root);

        const leaves = root.leaves();
        leaves.forEach((leaf, i) => {
          const leafDiv = d3.select(treemapDiv.node().querySelectorAll(".node")[i]);
          leafDiv
            .style("left", leaf.x0 + "px")
            .style("top", leaf.y0 + "px")
            .style("width", (leaf.x1 - leaf.x0) + "px")
            .style("height", (leaf.y1 - leaf.y0) + "px");
        });
      }
    }, 100); // 防抖延迟
  });
}
