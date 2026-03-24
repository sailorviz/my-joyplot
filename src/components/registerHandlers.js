export function registerHandlers(el, stateName, handlers) {
  if (!el._handlers) el._handlers = {};
  el._handlers[stateName] = handlers;
}