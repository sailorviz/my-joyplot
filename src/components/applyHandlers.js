export function applyHandlers(el, stateName) {
  if (!el._handlers || !el._handlers[stateName]) return;
  const handlers = el._handlers[stateName];

  Object.entries(handlers).forEach(([event, fn]) => {
    el.removeEventListener(event, fn); // 防止重复绑定
    el.addEventListener(event, fn);
  });

  el.dataset.state = stateName;
}