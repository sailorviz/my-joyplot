import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { moodColorMap } from '../../../components/moodColorMap';
import { genreColorMap } from '../../../components/genreColorMap';
import { updateLegend } from '../../../components/updateLegend';

export function drawSankeyChart(container, songs){
  // 移除已有的 sankey / treemap
  d3.select(container).select(".sankey")?.remove();
  d3.select(container).select(".Mood-treemap")?.remove();

  // show timeline title&legend SVG
  const oldTitleLegend = d3.select(container).select(".songs-titleLegend");

  if (!oldTitleLegend.empty()) {
    const title = oldTitleLegend.select(".title");
    if (!title.empty()) {
      title.text("Genre – Mood Sankey Diagram");
    }
    const legend = oldTitleLegend.select(".legend");
    if (!legend.empty()) {
      updateLegend(legend, "hide");
    }
    setTimeout(() => oldTitleLegend.style("opacity", 1), 500);
  }

  // --- Tooltip ---
  const tooltip = d3.select(container)
    .append("div")
    .attr("class", "sankey-tooltip")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("z-index", "9999")
    .style("opacity", 0)
    .style("background", "rgba(0,0,0,0.75)")
    .style("color", "#fff")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font-size", "12px");
  const rect = container.getBoundingClientRect();

  // -----------------------
  // 1️⃣ 准备节点和链接数据
  // -----------------------
  const nodesSet = new Set();
  const genreMoodMap = new Map();

  songs.forEach(song => {
    const genres = song.genre.split(',').map(g => g.trim());
    const moods = song.mood.split(',').map(m => m.trim());

    genres.forEach(g => nodesSet.add(g));
    moods.forEach(m => nodesSet.add(m));

    genres.forEach(g => {
      moods.forEach(m => {
        const key = `${g}||${m}`;
        genreMoodMap.set(key, (genreMoodMap.get(key) || 0) + 1);
      });
    });
  });

  // nodes 数组
  const nodes = Array.from(nodesSet).map(name => ({ name }));
  const nodeMap = new Map(nodes.map(n => [n.name, n]));

  // links 数组，确保 source/target 是节点对象
  const links = [];
  genreMoodMap.forEach((value, key) => {
    const [sourceName, targetName] = key.split('||');
    const sourceNode = nodeMap.get(sourceName);
    const targetNode = nodeMap.get(targetName);

    if (!sourceNode || !targetNode) return;

    links.push({
      source: sourceNode,
      target: targetNode,
      value
    });
  });

  // -----------------------
  // 2️⃣ 创建桑基图布局
  // -----------------------
  const width = window.innerWidth;
  const height = window.innerHeight;
  const offsetTop = height / 6 ;
  const offsetLeft = width / 6 ;

  const sankeyGenerator = sankey()
    .nodeWidth(20)
    .nodePadding(10)
    .extent([[offsetLeft, offsetTop], [width - offsetLeft, height - offsetTop]]);

  const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
      nodes: nodes,  // 不要复制
      links: links   // 不要复制
  });

  // -----------------------
  // 3️⃣ 创建 SVG
  // -----------------------
  const svg = d3.select(container)
    .append("svg")
    .attr("class", "sankey")
    .attr("width", width)
    .attr("height", height);
    // .style("z-index", 9999);

  // -----------------------
  // 4️⃣ 创建渐变 defs
  // -----------------------
  const defs = svg.append("defs");

  sankeyLinks.forEach((d, i) => {
    const gradId = `gradient-${i}`;
    const sourceColor = genreColorMap[d.source.name] || "#ccc";
    const targetColor = moodColorMap[d.target.name] || "#ccc";

    const gradient = defs.append("linearGradient")
      .attr("id", gradId)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", d.source.x1)
      .attr("y1", (d.source.y0 + d.source.y1)/2)
      .attr("x2", d.target.x0)
      .attr("y2", (d.target.y0 + d.target.y1)/2);

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", sourceColor);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", targetColor);

    d.gradientId = gradId;
  });

  // -----------------------
  // 5️⃣ 绘制 links
  // -----------------------
  svg.append('g')
    .attr('fill', 'none')
    .attr('stroke-opacity', 0.5)
    .selectAll('path')
    .data(sankeyLinks)
    .join('path')
    .attr('d', sankeyLinkHorizontal())
    .attr('stroke', d => `url(#${d.gradientId})`)
    .attr('stroke-width', d => Math.max(1, d.width));

  // -----------------------
  // 6️⃣ 绘制 nodes
  // -----------------------
  const node = svg.append("g")
    .selectAll("g")
    .data(sankeyNodes)
    .join("g");

  node.append('rect')
    .attr('x', d => d.x0)
    .attr('y', d => d.y0)
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('fill', d => genreColorMap[d.name] || moodColorMap[d.name] || "#ccc")
    .attr('stroke-width', 0.3)   
    .attr('stroke', '#fff');

  node.append('text')
    .attr('x', d => d.x0 - 6)
    .attr('y', d => (d.y0 + d.y1)/2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'end')
    .text(d => d.name)
    .attr('fill', '#ccc')  // 或者 '#ddd' '#bbb' 都可以
    .filter(d => d.x0 < width / 2)
    .attr('x', d => d.x1 + 6)
    .attr('text-anchor', 'start');
  
  node.classed("sankey-node", true);
  svg.selectAll("path").classed("sankey-link", true);

  // === helper: 计算与 node 相连的所有 nodes ===
  function getConnectedNodes(node) {
    const connected = new Set();

    node.sourceLinks?.forEach(l => connected.add(l.target));
    node.targetLinks?.forEach(l => connected.add(l.source));

    return connected;
  }
  // -----------------------------------------
  // 1️⃣ highlightNode 修复（核心修复部分）
  // -----------------------------------------
  function highlightNode(nodeDatum) {
    const connectedNodes = getConnectedNodes(nodeDatum);

    // nodes 处理
    d3.selectAll(".sankey-node rect")
      .classed("inactive", d => d !== nodeDatum && !connectedNodes.has(d))
      .classed("active", d => d === nodeDatum || connectedNodes.has(d));

    // links 高亮
    d3.selectAll(".sankey-link")
      .classed("inactive", l => l.source !== nodeDatum && l.target !== nodeDatum)
      .classed("active", l => l.source === nodeDatum || l.target === nodeDatum);
  }

  function unhighlightAll() {
    d3.selectAll(".sankey-node rect").classed("inactive active", false);
    d3.selectAll(".sankey-link").classed("inactive active", false);
  }

  node
    .each(function(d){ d.nodeEl = this; }) // 记录 DOM 引用（非常关键）
    .on("mouseover", function(e, d){
      highlightNode(d);

      tooltip
        .style("opacity", 1)
        .html(`<strong>${d.name}</strong>`);
    })
    .on("mousemove", function(e){
      tooltip
        .style("left", (e.clientX - rect.left + 10) + "px")
        .style("top", (e.clientY - rect.top - 40) + "px");
    })
    .on("mouseout", function(){
      unhighlightAll();
      tooltip.style("opacity", 0);
    });
  
  // -----------------------------------------
  // 4️⃣ Link hover（节点高亮修复）
  // -----------------------------------------
  svg.selectAll(".sankey-link")
    .on("mouseover", function(e, d) {
      const s = d.source;
      const t = d.target;

      // links 高亮
      d3.selectAll(".sankey-link")
        .classed("inactive", x => x !== d);
      d3.select(this).classed("active", true);

      // nodes 高亮
      d3.selectAll(".sankey-node rect")
        .classed("inactive", x => x !== s && x !== t)
        .classed("active", x => x === s || x === t);

      // tooltip
      tooltip
        .style("opacity", 1)
        .html(`
          <div><strong>${s.name} → ${t.name}</strong></div>
          <div>Songs Count: ${d.value}</div>
        `);
    })
    .on("mousemove", function(e){
      tooltip
        .style("left", (e.clientX - rect.left + 10) + "px")
        .style("top", (e.clientY - rect.top - 40) + "px");
    })
    .on("mouseout", function() {
      unhighlightAll();
      tooltip.style("opacity", 0);
    });
}

