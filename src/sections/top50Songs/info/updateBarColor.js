/**
 * 根据模式更新 bar 背景色
 * @param {HTMLElement} bar 
 * @param {String} mode 
 */

import { moodColorMap, moodCategoryColors } from "../../../components/moodColorMap";

export function updateBarColor(bar, mode) {
  if (mode === "mood") {
    const color = moodColorMap[bar.dataset.mood];
    bar.style.background = color || "#ccc";
  } else if (mode === "mood-group") {
    const color = moodCategoryColors[bar.dataset.group];
    bar.style.background = color || "#ccc";
  } else {
    bar.style.background = "none";
  }
}