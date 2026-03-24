// Kernel function（高斯核）
// Returns a kernel that expects the raw difference (y - v) and applies bandwidth internally.
export function kernelGaussianForPopularity(scale) {
  const coef = 1 / (scale * Math.sqrt(2 * Math.PI));
  return function(u) {
    // u is expected to be (y - v)
    const z = u / scale;
    return coef * Math.exp(-0.5 * z * z);
  };
}
