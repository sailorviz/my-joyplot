import { useState } from "react";
import { capitalizeWords } from "../../../../components/capitalizeWords";
import { genreColorMap } from "../../../../components/genreColorMap";
import { moodColorMap } from "../../../../components/moodColorMap";

function JoyplotControls({ filter, sort, onFilterChange, onSortChange }) {
  const genre = [
    "pop", "rock", "electronic", "poprock", "funk", "jazz", "disco",
    "classical", "soundtrack", "popfolk", "lounge", "hiphop", "reggae",
    "folk", "easylistening", "chillout", "soul", "house", "dance",
    "country", "blues", "alternative"
  ];

  const mood = [
    "happy", "energetic", "funny", "party", "summer", "inspiring",
    "christmas", "relaxing", "romantic", "melodic", "background",
    "ballad", "film", "meditative", "love", "deep", "dark"
  ];

  const filterOptions = { genre, mood };
  const sorts = ["dissonance", "bpm", "danceability", "dynamic-complexity"];

    // ------------------- 新增：根据 filter.type 获取 legend 显示 -------------------
  const getLegendEntries = () => {
    if (filter.type === "genre") {
      // 如果 filter-type = genre，则 waveform 显示 mood 的颜色，所以 legend 显示完整 moodColorMap
      return Object.entries(moodColorMap).map(([key, color]) => ({
        label: capitalizeWords(key),
        color
      }));
    } else if (filter.type === "mood") {
      // 如果 filter-type = mood，则 waveform 显示 genre 的颜色，所以 legend 显示完整 genreColorMap
      return Object.entries(genreColorMap).map(([key, color]) => ({
        label: capitalizeWords(key),
        color
      }));
    }
    return [];
  };

  const legendEntries = getLegendEntries();

  return (
    <div className="joyplot-controls">
      {/* Filter type */}
      <label>
        Filter type:
        <select
          value={filter.type}
          onChange={e =>
            onFilterChange({ type: e.target.value, value: "" })
          }
        >
          <option value="">Select</option>
          <option value="genre">Genre</option>
          <option value="mood">Mood</option>
        </select>
      </label>

      {/* Filter value */}
      <label>
        Filter value:
        <select
          value={filter.value}
          disabled={!filter.type}
          onChange={e =>
            onFilterChange({ type: filter.type, value: e.target.value })
          }
        >
          <option value="">Select</option>
          {filter.type &&
            filterOptions[filter.type].map(v => (
              <option key={v} value={v}>
                {capitalizeWords(v)}
              </option>
            ))}
        </select>
      </label>

      {/* Sort */}
      <label>
        Sort:
        <select
          value={sort}
          onChange={e => onSortChange(e.target.value)}
        >
          <option value="">Select</option>
          {sorts.map(s => (
            <option key={s} value={s}>
              {capitalizeWords(s)}
            </option>
          ))}
        </select>
      </label>

      {filter.type && legendEntries.length > 0 && (
        <div className="joyplot-legend">
          <div className="joyplot-legend-title">
            {filter.type === "genre" ? "Mood Color Map" : "Genre Color Map"}
          </div>
          <div className="joyplot-legend-items">
            {legendEntries.map(entry => (
              <div key={entry.label} className="joyplot-legend-item">
                <div
                  className="joyplot-legend-color"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default JoyplotControls;


// // react组件在joyplotBase中这样使用
// const JoyplotBase = forwardRef((_, ref) => {
//   const containerRef = useRef(null);
//   const [showControls, setShowControls] = useState(false);

//   useImperativeHandle(ref, () => ({
//     showControlsStep: () => setShowControls(true),
//     hideControls: () => setShowControls(false),
//   }));

//   return (
//     <div ref={containerRef}>
//       {/* 其他 Joyplot SVG 已经在 useEffect 创建 */}
//       {showControls && <Controls />}
//     </div>
//   );
// });

// Controls 本质上只是用户的输入界面，不涉及复杂的绘制逻辑和数据绑定，
// 所以不需要像 Joyplot 那样在 useEffect 里动态生成 SVG。
// 直接作为 React 组件管理它的显示、状态和事件就够了，而且也方便滚动驱动时的显示/隐藏。