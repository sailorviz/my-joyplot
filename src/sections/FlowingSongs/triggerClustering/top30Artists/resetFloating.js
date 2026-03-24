export function resetFloating(containerRef, runningRef, animateRef, positionsRef, opacityRef, speedRef, MAX_VISIBLE) {
  const container = containerRef.current;
  const children = Array.from(container.children);
  const width = window.innerWidth;
  const height = window.innerHeight;
  const random = (min, max) => Math.random() * (max - min) + min;


  // 1️⃣ 移除多余元素，只保留最初的 MAX_VISIBLE 个
  //返回一个从第 MAX_VISIBLE 个元素开始的“后半部分”数组
  children.slice(MAX_VISIBLE).forEach(el => {
    el.style.opacity = 0;
    el.style.pointerEvents = "none"; // 防止透明层阻挡点击
  });

  // 2️⃣ 恢复前 100 个元素为随机分布状态
  children.slice(0, MAX_VISIBLE).forEach((el, i) => {
    el.style.transition = "none";
    el.style.left = `${Math.random() * width}px`;
    el.style.top = `${Math.random() * height}px`;
    el.style.fontSize = `${random(14, 24)}px`;
    el.style.opacity = `${random(0.3, 0.9)}`;

    positionsRef.current[i] = parseFloat(el.style.left) || 0;
    opacityRef.current[i] = parseFloat(el.style.opacity) || 0.5;
    speedRef.current[i] = random(0.2, 0.4);
  });

  // 3️⃣ 重新启动漂浮动画
  runningRef.current = true;
  animateRef.current?.();
}
