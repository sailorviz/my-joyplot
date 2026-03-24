/**
 * 切换 mood / mood-group 模式
 * @param {Object} containerRef - React ref
 * @param {String} mode - "mood" 或 "mood-group"
 */
import { updateBarColor } from "./updateBarColor";

export function switchMoodGroup(containerRef, mode = "mood") {
  const bars = containerRef.current.querySelectorAll(".mood-bar");
  bars.forEach(bar => {
    bar.dataset.state = mode;
    updateBarColor(bar, mode);
  });
}