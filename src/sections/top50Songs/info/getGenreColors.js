export function getGenreColors(genreString, colorMap) {
  if (!genreString) return ["#BDBDBD", "#BDBDBD", "#BDBDBD"];

  let genres = genreString
    .split(/[,/]/)  // 支持 “pop, dance/house”
    .map(g => g.trim().toLowerCase())
    .filter(g => g.length > 0);

  // 去重
  genres = [...new Set(genres)];

  // 如果不足 3 种，为了视觉填补
  while (genres.length < 3) {
    genres.push(genres[genres.length - 1] || "default");
  }

  // 只取前 3 种
  genres = genres.slice(0, 3);

  return genres.map(g => colorMap[g] || colorMap.default);
}
