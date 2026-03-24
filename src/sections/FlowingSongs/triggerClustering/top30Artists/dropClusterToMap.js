import * as d3 from "d3";
import * as topojson from "topojson-client";

export function dropClusterToMap(containerRef, artistInfos, hoverVersionRef){
  const timelineSvg = containerRef.current.querySelector(".timeline");
  const titleLegendSvg = containerRef.current.querySelector(".timelineTitle");
  const clusterEls = containerRef.current.querySelectorAll(".clusterForArtist");
  const clusterElsArray = Array.from(clusterEls);
  const clusterElsMap = {};
  clusterElsArray.forEach(el => {
    clusterElsMap[el.dataset.artist] = el;
  });

  // 隐藏timelineSvg, titleLegendSvg，clusters暂停交互；
  timelineSvg.style.opacity = 0;
  titleLegendSvg.style.opacity = 0;
  clusterElsArray.forEach(cluster => cluster.style.pointerEvents = "none"); // 🔓 暂停交互

  // 绘制简略版地图，跟timeline一样，一开始在屏幕之外下方
  // 清除旧svg（避免重复绘制）
  d3.select(containerRef.current).select(".map").remove();
  // 创建 map SVG
  const mapHeight = window.innerHeight;
  const mapWidth = window.innerWidth; 
  const mapOriginalP = mapHeight;
  const durationY = 1500;
  const mapSvg = d3.select(containerRef.current)
    .append("svg")
    .attr("class", "map")
    .attr("width", mapWidth)
    .attr("height", mapHeight)
    .style("position", "absolute")
    .style("top", mapOriginalP)   // 初始：屏幕下面
    .style("border", "1px solid red")
    .style("transition", `top ${durationY}ms ease-out`)
    .style("opacity", 1);

  // svg在container内水平居中：用像素计算 left，避免 transform 被后续覆盖
  const containerWidth = containerRef.current.clientWidth || window.innerWidth;
  const leftPx = Math.round((containerWidth - mapWidth) / 2); // svg相对于container的偏移
  mapSvg.style("left", `${leftPx}px`);

  // 创建countryTooltip元素
  let countryTooltip = containerRef.current.querySelector(".country-tooltip");
  if (!countryTooltip) {
    countryTooltip = document.createElement("div");
    countryTooltip.className = "country-tooltip";
    Object.assign(countryTooltip.style, {
      position: "absolute",
      padding: "8px 12px",
      background: "rgba(0,0,0,0.75)",
      color: "white",
      borderRadius: "8px",
      fontSize: "12px",
      pointerEvents: "none", // ✅ 一定要有
      opacity: 0,
      transition: "opacity 0.2s ease",
      zIndex: 9999
    });
    containerRef.current.appendChild(countryTooltip);
  }

  // 投影和 path
  const projection = d3.geoMercator()
    .scale(120)
    .translate([mapWidth / 2, mapHeight / 1.5]);
  const path = d3.geoPath().projection(projection);

  // 准备地图和国家
  const mapGroup = mapSvg.append("g");

  const countryAlias = {
    USA: "United States of America",
    UK: "United Kingdom",
    Canada: "Canada",
    China: "China",
    Italy: "Italy",
    France: "France",
    Australia: "Australia",
  };

  // 返回一个对象
  const artistToCountry = Object.fromEntries(
    Object.entries(artistInfos).map(([artist, info]) => {
      let country = info.Country.trim();
      if (countryAlias[country]) country = countryAlias[country];
      return [artist, country];
    })
  );
  // 返回这个对象的values的不重复值数组
  const uniqueCountries = [...new Set(Object.values(artistToCountry))];

  // 手动覆盖美国和加拿大的质心坐标（经纬度）
  const countryCentroidOverride = {
    "United States of America": [-98, 39],   // 美国中西部
    "Canada": [-106, 56],                    // 加拿大中心
  };

  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(worldData => {
    const land = topojson.feature(worldData, worldData.objects.land);
    const countries = topojson.feature(worldData, worldData.objects.countries).features;

    // 绘制大陆轮廓
    mapGroup.append("path")
      .datum(land)
      .attr("d", path)
      .attr("class", "map-content") // 给它加个 class
      .attr("fill", "none")
      .attr("stroke", "#aaa")
      .attr("stroke-width", 1.5);

    // 筛选国家轮廓数据
    const countriesPath = countries.filter(d =>
      uniqueCountries.includes(d.properties.name)
    );

    const countryPaths = mapGroup.append("g")
      .selectAll("path")
      .data(countriesPath)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", "#ddd")
      .attr("stroke", "#aaa")
      .attr("stroke-width", 1);
    
    // // 地图上升
    const mapTanslateY = -mapHeight;
    const baseTransform = `translateY(${mapTanslateY}px)`;
    mapSvg
      .style("transform", baseTransform);

    // 计算所有国家的质心
    let centroids = {};   // ← 改成对象，每次都重新计算

    countriesPath.forEach(countryPath => {
      const countryName = countryPath.properties.name;//数据库里的名字
      let cx, cy;

      if (countryCentroidOverride[countryName]) {
        [cx, cy] = projection(countryCentroidOverride[countryName]);
      } else {
        const centroid = path.centroid(countryPath);
        if (centroid && !isNaN(centroid[0])) {
          [cx, cy] = centroid;
        } else {
          // 中国、法国等多岛国家可能返回 null，用 bounds 中心兜底
          const [[x0, y0], [x1, y1]] = path.bounds(countryPath);
          cx = (x0 + x1) / 2;
          cy = (y0 + y1) / 2;
        }
      }
      centroids[countryName] = { centroidX: cx, centroidY: cy };
    });


    // 计算targetX, targetY for each cluster
    const rect = containerRef.current.getBoundingClientRect();
    Object.entries(clusterElsMap).forEach(([artist, cluster]) => {
      const artistCountry = artistToCountry[artist];

      const { centroidX: cx, centroidY: cy } = centroids[artistCountry] || { centroidX: 0, centroidY: 0 };

      // 随机散布（每次重新随机！）
      const maxRadius = 20;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * maxRadius;
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius;

      const targetX = cx + dx;
      const targetY = cy + dy;

      const clusterRect = cluster.getBoundingClientRect();
      const clusterCenterX = clusterRect.left + clusterRect.width / 2;
      const clusterCenterY = clusterRect.top + clusterRect.height / 2;

      const prevTx = parseFloat(cluster.dataset.clusterTx) || 0;
      const prevTy = parseFloat(cluster.dataset.clusterTy) || 0;

      const tx = targetX + rect.x - clusterCenterX + prevTx;
      const ty = targetY + rect.y - clusterCenterY + prevTy;

      cluster.dataset.mapTx = tx;
      cluster.dataset.mapTy = ty;
      cluster.dataset.state = "mapping";

      cluster.style.transform = `translate(${tx}px, ${ty}px) scale(0.15)`;
    });

    // 重启交互，改变tooltip._handlers设置
    setTimeout(() => {
      // 改变 cluster hovering 状态（改变元素的位置）
      const tooltip = containerRef.current.querySelector(".artist-tooltip");
      const rect = containerRef.current.getBoundingClientRect();
      const allClusters = Object.values(clusterElsMap);
      const zoomScale = 6;
      const zoomDuration = 1500;

      // 2. 每次执行这步动画，版本号 +1（就这一行！）
      hoverVersionRef.current += 1;
      const thisVersion = hoverVersionRef.current;

      Object.entries(clusterElsMap).forEach(([artist, cluster]) => {
        const countryRaw = artistInfos[artist].Country; //原始数据里的名字
        const country = artistToCountry[artist];
        const prevTx = parseFloat(cluster.dataset.mapTx) || 0;
        const prevTy = parseFloat(cluster.dataset.mapTy) || 0;
        const otherClusters = allClusters.filter(c => c !== cluster);

        // 获取 质心 在svg内的坐标(相对坐标)
        const {centroidX, centroidY} = centroids[country];
        // 获取 质心 相对于视口的坐标（绝对坐标）
        const centroidX_abs = centroidX - rect.left; 
        const centroidY_abs = centroidY - rect.top;

        cluster.style.pointerEvents = "auto"; // 🔓 允许交互

        const mappingMouseEnter = (e) => {
          if (hoverVersionRef.current !== thisVersion) return; // 防鬼畜
          // hovering cluster原地缩放
          cluster.style.transition = `transform ${zoomDuration}ms ease-out`;
          cluster.style.transform = `translate(${prevTx}px, ${prevTy}px) scale(0.35)`;

          // cluster tooltip 设置
          tooltip.innerHTML = `<strong>${artist}</strong><br>Country: ${countryRaw}`;
          tooltip.style.left = `${e.clientX - rect.left + 10}px`;
          tooltip.style.top = `${e.clientY - rect.top - 40}px`;
          tooltip.style.opacity = 1;

          // 设置非触发clusters的translate
          otherClusters.forEach((otherCluster) => {
            // 获取当下cluster中心的绝对坐标
            const otherClusterRect = otherCluster.getBoundingClientRect();
            const otherClusterAbsX = otherClusterRect.left + otherClusterRect.width / 2;
            const otherClusterAbsY = otherClusterRect.top + otherClusterRect.height / 2;
            // 获取cluster的target position的绝对坐标
            const otherTargetX = (otherClusterAbsX - centroidX_abs) * zoomScale + centroidX_abs;
            const otherTargetY = (otherClusterAbsY - centroidY_abs) * zoomScale + centroidY_abs;
            // 获取新的位移值；
            const otherNewTx = otherTargetX - otherClusterAbsX;
            const otherNewTy = otherTargetY - otherClusterAbsY;
            // 获取other cluster的prevTX, prevTY
            const otherPrevTx = parseFloat(otherCluster.dataset.mapTx) || 0;
            const otherPrevTy = parseFloat(otherCluster.dataset.mapTy) || 0;

            const otherZoomTx = otherPrevTx + otherNewTx;
            const otherZoomTy = otherPrevTy + otherNewTy;

            otherCluster.style.transition = `transform ${zoomDuration}ms ease-out`;
            otherCluster.style.transform = `translate(${otherZoomTx}px, ${otherZoomTy}px) scale(0.15)`;
          });

          // 以选中国家的map质心为中心放大地图
          mapGroup.transition()
            .duration(zoomDuration)
            .attr("transform", `translate(${centroidX},${centroidY}) scale(${zoomScale}) translate(${-centroidX},${-centroidY})`);            
          // 高亮 cluster 所属的 country
          countryPaths.attr("fill", d => d.properties.name === country ? "#f8c471" : "#ddd");
          // 创建 text 元素（如果不存在就创建）
          const countryClass = `country-label-${country.replace(/\s+/g,'-')}`;
          let label = mapGroup.select(`text.country-label-${countryClass}`);
          if (label.empty()) {
            label = mapGroup.append("text")
              .attr("class", `country-label-${countryClass}`)
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "middle")
              .attr("font-size", 20)
              .attr("fill", "#8a8888ff")
              .text(countryRaw);
          }
          label.attr("x", centroidX).attr("y", centroidY).style("opacity", 1);
        };

        const mappingMouseMove = (e) => {
          if (hoverVersionRef.current !== thisVersion) return; // 防鬼畜
          tooltip.style.left = `${e.clientX - rect.left + 10}px`;
          tooltip.style.top = `${e.clientY - rect.top - 40}px`;
        };

        const mappingMouseLeave = () => {
          if (hoverVersionRef.current !== thisVersion) return; // 防鬼畜
          // hovering cluster 的恢复
          cluster.style.transform = `translate(${prevTx}px, ${prevTy}px) scale(0.15)`;
          tooltip.style.opacity = 0;

          // other clusters 的恢复
          otherClusters.forEach((otherCluster) => {
            // 获取other cluster的prevTX, prevTY
            const otherPrevTx = parseFloat(otherCluster.dataset.mapTx) || 0;
            const otherPrevTy = parseFloat(otherCluster.dataset.mapTy) || 0;

            otherCluster.style.transition = `transform ${zoomDuration}ms ease-out`;
            otherCluster.style.transform = `translate(${otherPrevTx}px, ${otherPrevTy}px) scale(0.15)`;
          });

          // 地图恢复
          const countryClass = `country-label-${country.replace(/\s+/g,'-')}`;
          mapGroup.selectAll(`text.country-label-${countryClass}`).style("opacity", 0);
          countryPaths.attr("fill", "#ddd");
          mapGroup.transition()
            .duration(zoomDuration)
            .attr("transform", "translate(0,0) scale(1)");
        };

        // 保存引用
        if (!cluster._handlers) cluster._handlers = {};
        
        cluster._handlers.mapping = {
          mouseenter: mappingMouseEnter,
          mousemove: mappingMouseMove,
          mouseleave: mappingMouseLeave
        };

        cluster.addEventListener("mouseenter", mappingMouseEnter);
        cluster.addEventListener("mousemove", mappingMouseMove);
        cluster.addEventListener("mouseleave", mappingMouseLeave);

      });
    }, 100);
  });
}