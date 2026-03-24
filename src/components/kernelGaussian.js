// Kernel function（高斯核）
export function kernelGaussian(scale) {
  return function(u) {
    return Math.exp(-0.5 * (u / scale) * (u / scale)) / Math.sqrt(2 * Math.PI);
  };
}