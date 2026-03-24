// extractSongTitleFromFilename.js
export function extractSongTitleFromFilename(filename) {
  if (!filename) return "";

  // 去掉 .mp3 后缀
  const withoutExt = filename.replace(/\.mp3$/i, "");

  // 按第一个 " - " 分割歌手和歌名
  const index = withoutExt.indexOf(" - ");
  if (index === -1) return withoutExt.trim(); // 没有 '-'，直接返回整个字符串

  // 返回 '-' 后面的部分，并去掉首尾空格
  return withoutExt.slice(index + 3).trim();
}
