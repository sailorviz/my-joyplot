import Papa from "papaparse";

export async function load500GreatestAlbums(csvPath) {
  const response = await fetch(csvPath);
  const csvText = await response.text();

  // 解析 CSV
  const parsed = Papa.parse(csvText, {
    header: true, // 自动把第一行当作表头
    skipEmptyLines: true
  });

  // 转成 { id: { ...info } } 结构
  const albumInfos = {};
  parsed.data.forEach(row => {
    const albumId = row.Id?.trim();
    if (!albumId) return; // 跳过空行

    albumInfos[albumId] = {
      album_name: row.Title,
      artist_name: row.Artist,
      release_year: Number(row.Year)
    };
  });

  return albumInfos;
}
