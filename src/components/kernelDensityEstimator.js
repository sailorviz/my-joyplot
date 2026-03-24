import * as d3 from "d3";
// KDE 主函数
export function kernelDensityEstimator(kernel, xScale, dataYears) {
  const xValues = xScale.ticks(100); // 生成 100 个时间点
  return xValues.map(x => {
    const v = d3.mean(dataYears, d => kernel((x - d) / (1000 * 60 * 60 * 24 * 365))); // 年份差值换算成年
    return [x, v];
  });
}