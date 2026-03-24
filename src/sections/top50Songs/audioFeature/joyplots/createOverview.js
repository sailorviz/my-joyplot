import * as d3 from "d3";

export function createOverview(container, initialSongs) {
  // ---------------- layout ----------------
  const overviewDiv = container.querySelector(".overview-div");
  if (!overviewDiv) {
    console.error("找不到 .overview-div");
    return;
  }

  // 強制讓容器可見且有空間
  overviewDiv.style.overflow = "visible";
  overviewDiv.style.position = "relative"; // 重要！讓 absolute 子元素有參考
  overviewDiv.style.minHeight = "150px";

  let songs = [...initialSongs]; // 初始數據引用（後續可替換）
  let width = overviewDiv.clientWidth;
  let height = overviewDiv.clientHeight;
  let currentSeriesType = "full";          // 初始值
  let currentAmplitudeFactor = 1;          // 初始值

  console.log("overview-div 實際尺寸:", width, "x", height);

  // 使用最保險的方式建立 SVG
  const svg = d3.select(overviewDiv)
    .append("svg")
    .attr("class", "overview-svg")
    .attr("width", "100%")          // 改用百分比，避免像素誤差
    .attr("height", "100%")
    .style("display", "block")      // 防止 inline 導致塌陷
    .style("position", "relative")  // 改成 relative，避免偏移
    .style("top", "0")
    .style("left", "0");

  // ---------------- scales ----------------
  const xScale = d3.scaleLinear();

  const yScale = d3.scaleLinear()
    .domain([
      d3.min(songs, d => d3.min(d.series)),
      d3.max(songs, d => d3.max(d.series))
    ])
    .range([height * 0.7, height * 0.3]); // 預留上下空間

  // ---------------- waveforms ----------------
  const waveformGroup = svg.append("g")
    .attr("class", "overview-waveforms")
    .attr("transform", `translate(0, 0)`); // 移除 centerY，或設為 0

  let paths = waveformGroup.selectAll("path")
    .data(songs)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", "#999")
    .attr("stroke-width", 1)
    .attr("opacity", 0.5);

  // ---------------- median ----------------
  function computeMedianSeries(songs) {
    const length = d3.max(songs, d => d.series.length);

    return d3.range(length).map(i => {
      const values = songs
        .map(d => d.series[i])
        .filter(v => v !== undefined);

      return d3.median(values);
    });
  }

  let medianSeries = computeMedianSeries(songs);

  const medianPath = svg.append("path")
    .datum(medianSeries)
    .attr("class", "overview-median")
    .attr("transform", `translate(0, 0)`) // 移除 centerY，或設為 0
    .attr("fill", "none")
    .attr("stroke", "#ffcc66")
    .attr("stroke-width", 3);

  function render({ xDomain, seriesType = "full", amplitudeFactor = 1 }) {
    // 1. sync xScale
    if (xDomain) {
      xScale
        .domain(xDomain)
        .range([0, width]);

      svg.attr("width", width);
    }

    // 2. choose series
    songs.forEach(d => {
      d.series =
        seriesType === "amp60" ? d.amplitude_60s :
        seriesType === "spec60" ? d.spectral_60s :
        d.waveform;
    });

    // 3. recompute median
    medianSeries = computeMedianSeries(songs);

    // 4. line generator
    const line = d3.line()
      .x((d, i) => xScale(i))
      .y(d => yScale(d * amplitudeFactor))
      .curve(
        seriesType === "spec60"
          ? d3.curveLinear
          : d3.curveBasis
      );

    // 5. draw
    paths.attr("d", d => line(d.series));
    medianPath
      .datum(medianSeries)
      .attr("d", line);

    // 成功渲染後，記住當前使用的參數
    currentSeriesType = seriesType;
    currentAmplitudeFactor = amplitudeFactor;
    // 調試用
    console.log("render called with:", { seriesType, amplitudeFactor });
  }

  // ⭐ 新增：updateData 邏輯，類似 createJoyplot 的 updateData
  function updateData(nextSongs) {
    // 1️⃣ 替換內部 songs 引用
    songs = [...nextSongs];

    // 確保 series 已存在（防禦式）
    songs.forEach(d => {
      if (!d.series) d.series = d.waveform;
    });

    // 2️⃣ 重新計算 yScale domain（基於新數據的 min/max）
    const yMin = d3.min(songs, d => d3.min(d.series || [])) || -1;
    const yMax = d3.max(songs, d => d3.max(d.series || [])) || 1;
    yScale.domain([yMin, yMax]);

    // 3️⃣ 重新 data join paths
    const nextPaths = waveformGroup.selectAll("path")
      .data(songs, d => d.id); // 使用 id 作為 key，確保穩定

    // 4️⃣ exit：淡出移除舊路徑
    nextPaths.exit()
      .transition()
      .duration(300)
      .style("opacity", 0)
      .remove();

    // 5️⃣ enter：新增新路徑
    const enterPaths = nextPaths.enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#999")
      .attr("stroke-width", 1)
      .attr("opacity", 0); // 初始透明

    // 6️⃣ merge：合併 enter + update
    paths = enterPaths.merge(nextPaths);

    // 7️⃣ 更新透明度（淡入）
    paths
      .transition()
      .duration(400)
      .style("opacity", 1);

    // 8️⃣ 重新計算 medianSeries
    medianSeries = computeMedianSeries(songs);
    medianPath.datum(medianSeries);

    // 9️⃣ 強制重新 render（使用當前參數）
    render({
      xDomain: xScale.domain(), // 保持當前 xDomain
      seriesType: currentSeriesType,
      amplitudeFactor: currentAmplitudeFactor, // 可替換為 ref 中的值，如果有
    });
  }

  // ---------------- api ----------------
  return {
    render,
    updateData, // ⭐ 新增 API
    show() {
      svg.style("opacity", 1);
    },
    hide() {
      svg.style("opacity", 0);
    },
    remove() {
      svg.remove();
    }
  };
}
// 调用方式
// overview.render({
//   xState: joyplot.getXState(),
//   seriesType: currentSeriesType
// });

