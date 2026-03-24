/**
 * 将 songs 投射到指定 feature 的 KDE x 轴上方
 * @param {HTMLElement} container - 包含所有 songs div 和 KDE cards 的容器
 * @param {Object} featureScales - { featureKey: d3.scaleLinear } 对应每个 feature 的 xScale
 * @param {string} featureKey - 要投射的 feature，比如 "bpm"、"dissonance" 等
 */
export function projectSongsToFeature(container, featureScales, featureKey) {
  const songDivs = container.querySelectorAll(".four-curves-songs");
  const xScale = featureScales[featureKey];

  if (!xScale) return;

  // 获取对应 KDE card 的 SVG 和 x-axis
  const card = container.querySelector(`.kde-card-${featureKey}`);
  if (!card) return;
  const svg = card.querySelector("svg");
  const xAxis = svg.querySelector(".x-axis");
  if (!xAxis) return;

  // x-axis 在页面上的绝对 y 相对 container
  const xAxisRect = xAxis.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const baseTop = xAxisRect.top - containerRect.top;
  const svgRect = svg.getBoundingClientRect();
  const svgLeftRelative = svgRect.left - containerRect.left;
  const baseTopOffset = -30; // x 轴上方偏移 15px
  const jitter = 15;           // 随机偏移范围 px
  const scale = 2;

  songDivs.forEach(div => {
    const value = +div.dataset[featureKey];
    if (!isNaN(value)) {
      // 🔑 关键：告诉 div 当前 feature 是什么
      div.dataset.featureKey = featureKey;
      const x = svgLeftRelative + xScale(value) * scale;
      const yJitter = (Math.random() - 0.5) * jitter * 2; // [-jitter, +jitter]
      
      div.style.left = `${x}px`;
      div.style.top = `${baseTop + baseTopOffset + yJitter}px`;
      div.style.display = "block";
    }
  });
}
