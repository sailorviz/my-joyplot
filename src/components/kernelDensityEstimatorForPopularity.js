// import * as d3 from "d3";

// // KDE for popularity distribution along Y-axis
// export function kernelDensityEstimatorForPopularity(kernel, yScale, dataPopularity) {
//   const yValues = yScale.ticks(100);  // 沿 y 轴生成采样点

//   return yValues.map(y => {
//     const v = d3.mean(
//       dataPopularity,
//       d => kernel((y - d))  // popularity 差值
//     );
//     return [y, v];
//   });
// }

import * as d3 from "d3";

/**
 * KDE for popularity (纵向)
 * kernel: kernelGaussian(bandwidth) — expects raw difference (y - v)
 * bandwidth: numeric
 * values: array of popularity numbers
 * options: { yMin, yMax, step }
 * returns: [[y, density], ...] where y in [yMin, yMax]
 */
export function kernelDensityEstimatorForPopularity(kernel, bandwidth, values, options = {}) {
  const yMin = options.yMin ?? 0;
  const yMax = options.yMax ?? 100;
  const step = options.step ?? 1;

  // sample points from yMin..yMax
  const range = d3.range(yMin, yMax + 1e-9, step);

  const kde = range.map(y => {
    const density = d3.mean(values, v => kernel(y - v)); // NOTE: pass raw diff, kernel handles bandwidth
    return [y, density || 0];
  });

  return kde;
}


