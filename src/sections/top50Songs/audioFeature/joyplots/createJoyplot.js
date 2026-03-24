import * as d3 from "d3";
import { genreColorMap } from "../../../../components/genreColorMap";
import { moodColorMap } from "../../../../components/moodColorMap";

export function createJoyplot(container, initialSongs, tooltip, allInteractionLockedRef, clickLockedRef) {
  // data: [{ id, song, artist, mood, waveform, ... }]

  // ---------------- layout ----------------
  let rowHeight = 30;
  let margin = rowHeight / 2;
  let width = 0;
  let height = 0;
  const focusScaleFactor = 1.35;
  let amplitudeFactor = 1;

  const centerY = window.innerHeight / 2;

  // ---------------- state ----------------
  let currentAudio = null;
  let currentSongId = null;
  let focusedSongId = null;
  let isPlaying = false;
  let interactionLocked = false;
  let tooltipActive = false;
  let hoveredSongId = null;
  let filter = { type: "", value: "" };
  let sort = "";
  let topOneSong = null;
  let tooltipStage = "waveform";
  let currentSeriesType = "full";

  // ---------------- title / legend / close ----------------

  const closeBtn = d3.select(container).select(".left-panel").select(".joyplot-div")
    .append("div")
    .attr("class", "joyplot-close-btn")
    .text("×")
    .style("opacity", 0)
    .on("click", resetFocus);

  // ---------------- svg ----------------
  const svg = d3.select(container).select(".left-panel").select(".joyplot-div")
    .append("svg")
    .attr("class", "joyplot-svg")
    .attr("width", 0)
    .attr("height", 0);
    // .attr("width", width)
    // .attr("height", height + margin * 2);
  
  // 初始化 d.series
  let data = initialSongs;
  data.forEach(d => { d.series = d.waveform; });

  // ---------------- scales ----------------
  const maxIndex = d3.max(data, d => d.series.length);

  let xScale = d3.scaleLinear()
    .domain([0, maxIndex])
    .range([0, width]);

  let yScale = d3.scaleLinear()
    .domain([
      d3.min(data, d => d3.min(d.series)),
      d3.max(data, d => d3.max(d.series))
    ])
    .range([rowHeight / 2, -rowHeight / 2]);

  let yOffset = d3.scaleBand()
    .domain(data.map(d => d.id))
    .range([margin, height + margin])
    .padding(0);

  // ---------------- layers ----------------
  let layers = svg.selectAll(".joy-layer")
    .data(data, d => d.id)
    .join("g")
    .attr("class", "joy-layer")
    .attr("transform", d => `translate(0, ${yOffset(d.id)})`)
    .style("pointer-events", "auto");

  // 在每个 layer 里再包一层 inner g
  layers.each(function(d) {
    const layer = d3.select(this);
    const inner = layer.append("g").attr("class", "waveform-inner");

    inner.append("path")
      .attr("class", "joy-path-visible")
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 0.3);
    
    // ⭐ 为 enriched 预留 group
    inner.append("g")
      .attr("class", "joy-path-enriched-group");

    inner.append("path")
      .attr("class", "joy-path-hit")
      .attr("fill", "none")
      .attr("stroke", "transparent")
      .attr("stroke-width", 10)
      .style("pointer-events", "stroke");
  });


  // =====================================================
  // ✅ 修改点 1：统一的 waveform 重绘函数（核心）
  // =====================================================
  // 抽离line生成器
  function getLineGenerator() {
    return d3.line()
      .x((d, i) => xScale(i))
      .y(d => {
        if (currentSeriesType === "spec60") {
          return yScale(d);
        }
        return yScale(d * amplitudeFactor);
      })
      .curve(
        currentSeriesType === "spec60"
          ? d3.curveLinear
          : d3.curveBasis
      );
  }

  function getSeries(d) {
    switch(currentSeriesType) {
      case "amp60": return d.amplitude_60s;
      case "spec60": return d.spectral_60s;
      default: return d.waveform;
    }
  }

  function redrawWaveforms() {    
    const line = getLineGenerator();

    layers.selectAll(".joy-path-visible")
      .attr("d", d => line(getSeries(d)));

    layers.selectAll(".joy-path-hit")
      .attr("d", d => line(getSeries(d)));

    layers.selectAll(".joy-path-clip")
      .attr("d", d => line(getSeries(d)));

    layers.selectAll(".joy-path-enriched")
    .attr("d", d => line(getSeries(d))); // ⭐ 新增这一行
    
    console.log("currentSeriesType:", currentSeriesType);
  }

  // 加强版的 updateScales：只在 domain 不合理时才修正
  function updateScales(forceResetX = false) {
    const currentMaxIndex = d3.max(data, d => d.series?.length || 0) || 1;

    const [currMin, currMax] = xScale.domain();

    // 如果强制重置（比如 resize 时想回到全貌），或者当前 domain 超出数据范围
    if (forceResetX || currMax > currentMaxIndex || currMax <= currMin) {
      xScale.domain([0, currentMaxIndex]);
    }
    // 注意：这里**不**无条件覆盖用户手动设置的 zoom domain

    // yScale 总是更新（因为 series 变了范围会变）
    const allValues = data.flatMap(d => d.series || []);
    const yMin = allValues.length ? d3.min(allValues) : -1;
    const yMax = allValues.length ? d3.max(allValues) : 1;
    yScale.domain([yMin, yMax]);
  }

  function syncToContainer() {
    const joyplotDiv = container.querySelector(".joyplot-div");
    if (!joyplotDiv) return;

    width = joyplotDiv.clientWidth;
    height = joyplotDiv.clientHeight - margin * 2;
    console.log(width, height);

    // ✅ 新增条件：尺寸和 series 数据都准备好
    if (width <= 0 || height <= 0 || data.some(d => !d.series || !d.series.length)) {
      requestAnimationFrame(syncToContainer);
      return;
    }

    svg
      .attr("width", width)
      .attr("height", height + margin * 2);

    // x：时间 → 像素
    xScale.range([0, width]);

    // y：每条 waveform 的位置
    yOffset.range([margin, height + margin]);

    // 所有 layer 重新定位
    layers
      .attr("transform", d => `translate(0, ${yOffset(d.id)})`);

    updateScales();
    redrawWaveforms();
  }

  // ✅ 初始绘制
  syncToContainer();

  // 更改振幅的高度
  function setAmplitude(nextFactor, { animate = false } = {}) {
    amplitudeFactor = nextFactor;
    updateScales();  // ✅ 更新 scales

    if (animate) {
      layers
        .transition()
        .duration(300)
        .attrTween("d", function (d) {
          const prev = d3.select(this).attr("d");
          redrawWaveforms();
          const next = d3.select(this).attr("d");
          return d3.interpolateString(prev, next);
        });
    } else {
      redrawWaveforms();
    }
  }

  // ✅ 新增：切换 waveform 数据源(全量初始数据)
  function setSeries(type) {
    currentSeriesType = type;

    initialSongs.forEach(d => {
      if (type === "full") {
        d.series = d.waveform;
      } else if (type === "amp60") {
        d.series = d.amplitude_60s;
      } else if (type === "spec60") {
        d.series = d.spectral_60s;
      }
    });

    updateScales();  // ✅ 更新 scales
    redrawWaveforms();
  }

  // --------------- 设置enriched waveforms样式--------------------
  function applyBaseEncoding() {
    layers.selectAll(".joy-path-visible")
      .attr("stroke", "#ccc")
      .attr("stroke-width", d =>
        d.renderMode === "enriched" ? 1 : 0.3
      )
      .attr("opacity", d =>
        d.renderMode === "enriched" ? 0 : 0.6
      );
  }

  function getEnrichedKeys(d, filter) {
    if (!filter?.type) return [];

    if (filter.type === "genre") {
      return d.mood?.split(",").map(v => v.trim()) ?? [];
    }

    if (filter.type === "mood") {
      return d.genre?.split(",").map(v => v.trim()) ?? [];
    }

    return [];
  }

  function applyEnrichedEncoding(filter) {
    const bandOffset = 3; // 垂直偏移像素
    const line = getLineGenerator();

    layers.each(function(d) {
      const layer = d3.select(this);
      const group = layer.select(".joy-path-enriched-group");

      group.selectAll("*").remove();

      if (d.renderMode !== "enriched") return;

      const keys = getEnrichedKeys(d, filter).slice(0, 3);
      if (!keys.length) return;

      keys.forEach((key, i) => {
        const color =
          filter.type === "genre"
            ? moodColorMap[key]
            : genreColorMap[key];

        group.append("path")
          .datum(d)
          .attr("class", "joy-path-enriched")
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 0.6)
          .attr("transform", `translate(0, ${i * bandOffset - bandOffset})`)
          .attr("d", d => line(getSeries(d)));
      });
    });
  }

  function applyEncoding(filter) {
    applyBaseEncoding();
    applyEnrichedEncoding(filter);
  }

  function updateEncoding(nextFilter) {
    filter = nextFilter;

    if (!layers) return;
    // derived state
    layers.each(function(d, i) {
      d.renderMode =
        filter.type && (d.id === topOneSong?.id || d.id === hoveredSongId)
          ? "enriched"
          : "normal";
    });

    // encoding
    redrawWaveforms();
    applyEncoding(filter);
  }

  function updateData(nextSongs) {
    // 1️⃣ 替换内部 data 引用
    data = nextSongs;
    topOneSong = data[0];

    // 确保 series 已存在（防御式）
    data.forEach(d => {
      if (!d.series) d.series = d.waveform;
    });

    // 2️⃣ 更新 yOffset（数量 / 顺序可能变）
    yOffset
      .domain(data.map(d => d.id))
      .range([margin, height + margin]);

    // 3️⃣ 关键：重新 data join
    const nextLayers = svg.selectAll(".joy-layer")
      .data(data, d => d.id);

    // 4️⃣ exit
    nextLayers.exit()
      .transition()
      .duration(300)
      .style("opacity", 0)
      .remove();

    // 5️⃣ enter
    const enterLayers = nextLayers.enter()
      .append("g")
      .attr("class", "joy-layer")
      .attr("transform", d => `translate(0, ${yOffset(d.id)})`)
      .style("opacity", 0);
    
    enterLayers.each(function(d) {
      const layer = d3.select(this);
      const inner = layer.append("g").attr("class", "waveform-inner");

      inner.append("path")
        .attr("class", "joy-path-visible")
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 0.3);

      inner.append("g")
        .attr("class", "joy-path-enriched-group");

      inner.append("path")
        .attr("class", "joy-path-hit")
        .attr("fill", "none")
        .attr("stroke", "transparent")
        .attr("stroke-width", 10)
        .style("pointer-events", "stroke");
    });

    // 6️⃣ merge（这是灵魂）
    layers = enterLayers.merge(nextLayers);

    // 7️⃣ 更新位置
    layers
      .transition()
      .duration(400)
      .attr("transform", d => `translate(0, ${yOffset(d.id)})`)
      .style("opacity", 1);

    // 8️⃣ 重绘 waveform（复用你已有的）
    updateScales();  // ✅ 更新 scales
    updateEncoding(filter);
    bindLayerEvents(layers);
  }

  function updateSort(nextSort) {
    sort = nextSort;
  }

  function getTooltipContent(d) {
    // d: 当前 hover 的 song 对象
    // 全局状态： filter, sort, topOneSong
    let genre = null;
    if (filter?.value) {
      genre = filter.value;
    }

    // 2️⃣ sort 值和差值
    let sortValue = null;
    let sortDiff = null;
    if (sort) {
      const currentVal = Number(d[sort]) || 0;
      const topVal = topOneSong ? Number(topOneSong[sort]) || 0 : 0;
      sortValue = currentVal.toFixed(4);
      sortDiff = (currentVal - topVal).toFixed(4);
    }

    // 3️⃣ enriched keys: mood 或 genre
    let enriched = "";
    if (filter?.type) {
      enriched = getEnrichedKeys(d, filter).join(", ");
    }

    return {
      sortValue,
      sortDiff,
      enriched,
      genre
    };
  }

  function updateTooltipStage(nextStage){
    tooltipStage = nextStage;
  }

  function updateTooltip(d) {
    if (!d) return;

    if (tooltipStage === "waveform") {
      tooltip.innerHTML =
        focusedSongId === d.id
          ? "Click waveform to play / pause"
          : `<strong>${d.song} - ${d.artist}</strong>`;
    } else if (tooltipStage === "exploratory") {
      const {
        sortValue,
        sortDiff,
        enriched,
        genre
      } = getTooltipContent(d);

      tooltip.innerHTML = `
        <strong>${d.song} - ${d.artist}</strong>
        ${genre !== null ? `<div>${filter.type === "genre" ? "Genre" : "Mood"}: ${genre}</div>` : ""}
        ${enriched ? `<div>${filter.type === "genre" ? "Mood" : "Genre"}: ${enriched}</div>` : ""}
        ${sortValue !== null ? `<div>Value: ${sortValue}</div>` : ""}
        ${sortDiff !== null ? `<div>Diff with top one: ${sortDiff}</div>` : ""}
      `;
    }
  }


  // ---------------- hover / tooltip ----------------
  function bindLayerEvents(layers){
    // ⚠️ legacy: interaction-only handler
    // do NOT add visual encoding here

    layers
      .on("mouseenter", function (event, d) {
        if (allInteractionLockedRef?.current) return;
        if (interactionLocked && focusedSongId !== d.id) return;

        hoveredSongId = d.id;

        // 1️⃣ 更新样式 / 状态
        if (filter.type) {
          updateEncoding(filter); // 状态驱动更新
        } else {
          const layerPath = d3.select(this).select(".joy-path-visible");
          if (!interactionLocked) {
            layerPath.attr("stroke", "#ffcc66").attr("stroke-width", 0.6);
            layers.filter(l => l.id !== d.id)
              .select(".joy-path-visible")
              .attr("stroke-width", 0.1);
          }
        }

        // 2️⃣ tooltip 显示
        tooltipActive = true;
        tooltip.style.opacity = 1;
        updateTooltip(d);
        // tooltip.innerHTML =
        //   focusedSongId === d.id
        //     ? "Click waveform to play / pause"
        //     : `<strong>${d.song} - ${d.artist}</strong>`;

      })
      .on("mousemove", function (event) {
        if (!tooltipActive) return;
        tooltip.style.left = `${event.clientX + 12}px`;
        tooltip.style.top = `${event.clientY + 12}px`;
      })
      .on("mouseleave", function () {
        hoveredSongId = null;

        // 1️⃣ 隐藏 tooltip
        tooltipActive = false;
        tooltip.style.opacity = 0;

        // 2️⃣ 状态驱动重绘
        if (filter.type) {
          updateEncoding(filter);
          return;
        }

        // 3️⃣ 非状态驱动的 DOM reset
        if (!interactionLocked) {
          layers.select(".joy-path-visible")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 0.3);
        }
      });

    // ---------------- click ----------------
    layers.on("click", function (event, d) {
      if (allInteractionLockedRef?.current) return;
      if (clickLockedRef?.current) return;
      event.stopPropagation();
      if (interactionLocked && focusedSongId !== d.id) return;
      handleClick(d);
    });
  }

  function handleClick(d) {
    if (focusedSongId === d.id) {
      if (!currentAudio) return;
      currentAudio.paused ? currentAudio.play() : currentAudio.pause();
      return;
    }

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    layers.selectAll("clipPath").remove();
    layers.selectAll(".clip-overlay,.playhead,.joy-path-clip,.clip-start-time").remove();

    const audioURL = `/audios/trimed_10s_audio/${d.song}.mp3`;
    currentAudio = new Audio(audioURL);

    currentAudio.onloadedmetadata = () => {
      interactionLocked = true;
      currentAudio.play();

      const clipStartIndex =
        (d.clip_start || 0) / d.duration * d.waveform.length;

      const clipEndIndex =
        ((d.clip_start || 0) + (d.clip_duration || 0)) / d.duration * d.waveform.length;

      const clipStartX = xScale(clipStartIndex);
      const clipEndX = xScale(clipEndIndex);

      addClipOverlay(d, clipStartX, clipEndX - clipStartX);
      const { clipRect } = addClipWaveform(d, clipStartX);
      addPlayhead(d, clipStartX, clipEndX - clipStartX, clipRect);

      animateFocusWaveform(d.id);
      focusedSongId = d.id;
    };

    currentAudio.onended = resetFocus;
    closeBtn.transition().style("opacity", 1);
  }

  // ---------------- focus animation ----------------
  function animateFocusWaveform(id) {
    layers.each(function(l) {
      const layer = d3.select(this);
      const inner = layer.select(".waveform-inner");

      if (l.id === id) {
        // 1️⃣ 计算 deltaY，让 waveform 居中
        const deltaY = centerY - yOffset(l.id);
        layer.transition().duration(400)
          .attr("transform", `translate(0, ${yOffset(l.id) + deltaY})`)
          .style("opacity", 1);

        // 2️⃣ 内层 scale 缩放 waveform
        // 为了从中心缩放，可以先向上平移 rowHeight/2，再 scale，再平移回来
        inner.transition().duration(400)
          .attr("transform", `translate(0, ${-rowHeight/2}) scale(${focusScaleFactor}) translate(0, ${rowHeight/2})`);
      } else {
        // 恢复其他 waveform
        layer.transition().duration(400)
          .attr("transform", `translate(0, ${yOffset(l.id)})`)
          .style("opacity", 0.2);

        inner.transition().duration(400)
          .attr("transform", `translate(0,0) scale(1)`);
      }
    });
  }

  // ---------------- clip overlay ----------------
  function addClipOverlay(d, x, width) {
    const layer = layers.filter(l => l.id === d.id);
    const inner = layer.select(".waveform-inner");

    inner.append("rect")
      .attr("class", "clip-overlay")
      .attr("x", x)
      .attr("y", -rowHeight)
      .attr("width", width)
      .attr("height", rowHeight * 2)
      .attr("fill", "rgba(255,204,102,0.2)")
      .style("pointer-events", "none"); // ✅ 关键
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // ---------------- clip waveform ----------------
  function addClipWaveform(d, clipStartX) {
    const layer = layers.filter(l => l.id === d.id);
    const inner = layer.select(".waveform-inner");

    const clipId = `waveform-clip-${d.id}`;

    const clip = inner.append("clipPath")
      .attr("id", clipId)
      .attr("clipPathUnits", "userSpaceOnUse");

    const clipRect = clip.append("rect")
      .attr("x", clipStartX)
      .attr("y", -rowHeight)
      .attr("width", 0)
      .attr("height", rowHeight * 2);

    inner.append("path")
      .attr("class", "joy-path-clip")
      .attr("fill", "none")
      .attr("stroke", "#fa4614ff")
      .attr("stroke-width", 0.3)
      .attr("clip-path", `url(#${clipId})`);

    // 3️⃣ startTime 文本也放 inner 内部
    inner.append("text")
      .attr("class", "clip-start-time")
      .attr("x", clipStartX)
      .attr("y", -rowHeight - 2)
      .attr("fill", "#ffcc66")
      .text(formatTime(d.clip_start || 0));

    updateScales();
    redrawWaveforms(); // ✅ clip 也用统一几何

    return { clipRect };
  }

  // ---------------- playhead ----------------
  function addPlayhead(d, clipStartX, clipWidth, clipRect) {
    const layer = layers.filter(l => l.id === d.id);
    const inner = layer.select(".waveform-inner");

    inner.append("line")
      .attr("class", "playhead")
      .attr("y1", -rowHeight)
      .attr("y2", rowHeight)
      .attr("stroke", "#ffcc66");

    currentAudio.ontimeupdate = () => {
      const progress = Math.min(
        currentAudio.currentTime / (d.clip_duration || 10),
        1
      );
      const x = clipStartX + progress * clipWidth;
      inner.select(".playhead").attr("x1", x).attr("x2", x);
      clipRect.attr("width", progress * clipWidth);
    };
  }

  function resetFocus() {
    layers.each(function(l) {
      const layer = d3.select(this);
      const inner = layer.select(".waveform-inner");

      // 外层恢复原始 yOffset + opacity
      layer.transition().duration(400)
        .attr("transform", `translate(0, ${yOffset(l.id)})`)
        .style("opacity", 1);

      // 内层 scale 复原
      inner.transition().duration(400)
        .attr("transform", `translate(0,0) scale(1)`);
    });

    // 移除 overlay/playhead
    layers.selectAll("clipPath").remove();
    layers.selectAll(".clip-overlay,.playhead,.joy-path-clip,.clip-start-time").remove();

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }

    focusedSongId = null;
    interactionLocked = false;
    tooltip.style.opacity = 0;
    closeBtn.transition().style("opacity", 0);
  }

  bindLayerEvents(layers);

  // =====================================================
  // ✅ 修改点 2：稳定的 zoomWaveform
  // =====================================================
  return {
    xScale,  // 初始值快照
    domain:[0, maxIndex],
    getSVGArea() {
      return {
        height: svg.attr("height"),
        width: svg.attr("width"),
      };
    },
    // zoomWaveform({ newDomain }) {
    //   if (newDomain) {
    //     xScale.domain(newDomain);
    //   }
    //   updateScales();  // ✅ 更新 scales
    //   redrawWaveforms();
    // },
    zoomWaveform({ newDomain }) {
      if (newDomain && Array.isArray(newDomain) && newDomain.length === 2) {
        // 优先使用用户传入的 domain
        xScale.domain(newDomain);
        
        // 只做合理性检查，不强制重置
        const currentMax = d3.max(data, d => d.series?.length || 0);
        if (newDomain[1] > currentMax) {
          console.warn("Zoom domain exceeds current data length, capping...");
          xScale.domain([newDomain[0], currentMax]);
        }
      }

      // yScale 正常更新
      updateScales();  // 注意这里没有 forceResetX，所以不会覆盖 x domain
      redrawWaveforms();
    },
    syncToContainer,
    setSeries,
    getXScale() {
      return xScale;
    },
    getXDomain() {
      return xScale.domain();
    },
    updateData,
    setAmplitude,
    updateEncoding,
    updateSort,
    updateTooltipStage,
  };
}

