import * as d3 from "d3";

export function createKDEChart({
  card,
  values,
  featureKey,
  color,
  height,
  margin
}) {
  let xScale;
  let yScale;
  let density;
  let svg;
  let markerLayer;        // 圆点 + 竖线
  let kdeArea;
  let areaHoverLayer;
  let areaRefLayer;


  function init() {
    const width = card.clientWidth || 320;

    svg = d3.select(card)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto");

    const xDomain = d3.extent(values);
    const dx = (xDomain[1] - xDomain[0]) || 1;

    xScale = d3.scaleLinear()
      .domain([xDomain[0] - dx * 0.05, xDomain[1] + dx * 0.05])
      .range([margin.left, width - margin.right]);

    const bandwidth = silvermanBandwidth(values);
    const xTicks = xScale.ticks(60);
    density = kernelDensityEstimator(values, xTicks, bandwidth);

    yScale = d3.scaleLinear()
      .domain([0, d3.max(density, d => d[1])])
      .range([height - margin.bottom, margin.top]);

    svg.append("path")
      .datum(density)
      .attr("class", "curve")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("d", d3.line()
        .curve(d3.curveBasis)
        .x(d => xScale(d[0]))
        .y(d => yScale(d[1]))
      );
    
    kdeArea = d3.area()
      .curve(d3.curveBasis)
      .x(d => xScale(d[0]))
      .y0(yScale(0))
      .y1(d => yScale(d[1]));

    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(10))
      .style("opacity", 0);

    markerLayer = svg.append("g")
      .attr("class", "kde-marker-layer");
    
    areaHoverLayer = svg.append("g").attr("class", "kde-area-hover");
    areaRefLayer = svg.append("g").attr("class", "kde-area-ref");


  }

  function createBandwidthClip(id, x0, x1, height) {
    const clip = svg.append("clipPath")
      .attr("id", id);

    clip.append("rect")
      .attr("x", xScale(x0))
      .attr("y", 0) //SVG 坐标系中 0 在最上方，往下 y 增加。因为 clipPath 要覆盖整个高度，从顶部开始，所以 y=0。
      .attr("width", xScale(x1) - xScale(x0))
      .attr("height", height);

    return clip;
  }

  function highlightKDEAreaHover(value, bandwidth) {
    areaHoverLayer.selectAll("*").remove();

    const x0 = value - bandwidth / 2;
    const x1 = value + bandwidth / 2;

    const clipId = `clip-hover-${Math.random().toString(36).slice(2)}`;

    createBandwidthClip(
      clipId,
      x0,
      x1,
      height
    );

    areaHoverLayer.append("path")
      .datum(density)
      .attr("class", "kde-area-hover")
      .attr("fill", color)
      .attr("fill-opacity", 0.25)
      .attr("clip-path", `url(#${clipId})`)
      .attr("d", kdeArea);
  }

  function clearKDEHover() {
    areaHoverLayer.selectAll("*").remove();
  }

  function addKDEAreaReference(value, bandwidth) {
    // 先清掉旧的 reference
    clearKDEAreaReference();
    
    const x0 = value - bandwidth / 2;
    const x1 = value + bandwidth / 2;

    const clipId = `clip-ref-${Date.now()}`;

    createBandwidthClip(
      clipId,
      x0,
      x1,
      height
    );

    areaRefLayer.append("path")
      .datum(density)
      .attr("class", "kde-area-ref")
      .attr("fill", color)
      .attr("fill-opacity", 0.4)
      .attr("clip-path", `url(#${clipId})`)
      .attr("d", kdeArea);
  }

  function clearKDEAreaReference() {
    areaRefLayer.selectAll("*").remove();
  }

  function getDensityAt(x) {
    for (let i = 0; i < density.length - 1; i++) {
      const [x0, y0] = density[i];
      const [x1, y1] = density[i + 1];

      if (x >= x0 && x <= x1) {
        const t = (x - x0) / (x1 - x0);
        return y0 + t * (y1 - y0);
      }
    }
    return null;
  }

  function showKDEMarker(value) {
    markerLayer.selectAll("*").remove();

    const y = getDensityAt(value);
    if (y == null) return;

    // 竖线（可选保留）
    markerLayer.append("line")
      .attr("x1", xScale(value))
      .attr("x2", xScale(value))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .attr("stroke", "#fff")
      .attr("stroke-dasharray", "4,2")
      .attr("opacity", 0.6);

    // 曲线交点
    markerLayer.append("circle")
      .attr("cx", xScale(value))
      .attr("cy", yScale(y))
      .attr("r", 4)
      .attr("fill", "#fff")
      .attr("stroke", color)
      .attr("stroke-width", 1.5);
  }

  function clearKDEMarker() {
    markerLayer.selectAll("*").remove();
  }

  function updateFromState(state) {
    const domain = xScale.domain();
    const bw = (domain[1] - domain[0]) * 0.1;

    // hover
    if (state.hover && state.hover.feature === featureKey) {
      const value = state.hover.value;
      highlightKDEAreaHover(value, bw);
      showKDEMarker(value);
    } else {
      clearKDEHover();
      clearKDEMarker();
    }

    // reference（暂时保留你原来的实现）
    if (state.reference && state.reference.feature === featureKey) {
      const value = state.reference.value;
      addKDEAreaReference(value, bw);
    } else {
      clearKDEAreaReference();
    }
  }


  return {
    init,
    updateFromState,
    getXScale: () => xScale
  };

}

/* helpers */
function gaussian(u) {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);
}

function silvermanBandwidth(values) {
  const n = values.length;
  const sd = d3.deviation(values) || 1;
  return 1.06 * sd * Math.pow(n, -1 / 5);
}

function kernelDensityEstimator(values, xTicks, bandwidth) {
  return xTicks.map(x => [
    x,
    d3.mean(values, v => gaussian((x - v) / bandwidth) / bandwidth) || 0
  ]);
}
