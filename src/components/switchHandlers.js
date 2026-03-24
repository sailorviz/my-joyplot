export function switchHandlers(el, fromState, toState) {
  if (!el._handlers) return;

  const old = el._handlers[fromState];
  const next = el._handlers[toState];

  if (old) {
    Object.entries(old).forEach(([event, fn]) => {
      el.removeEventListener(event, fn);
    });
  }
  if (next) {
    Object.entries(next).forEach(([event, fn]) => {
      el.addEventListener(event, fn);
    });
  }

  el.dataset.state = toState;
}