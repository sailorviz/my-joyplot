import Papa from "papaparse";

export async function loadAlbumInfo(csvPath) {
  const response = await fetch(csvPath);
  const csvText = await response.text();

  // 解析 CSV
  const parsed = Papa.parse(csvText, {
    header: true, // 自动把第一行当作表头
    skipEmptyLines: true
  });

  // 转成 { albumName: { ...info } } 结构
  const albumInfos = {};
  parsed.data.forEach(row => {
    const album = row.album_name?.trim();
    if (!album) return; // 跳过空行

    // 🔥 提取主艺人：只取逗号前的第一位
    const rawArtist = row.artist_name?.trim() || "";

    let mainArtist = rawArtist;
    if (rawArtist.includes(",")) {
      mainArtist = rawArtist.split(",")[0].trim();
    }

    albumInfos[album] = {
      artist_name: row.artist_name,
      main_artist: mainArtist,
      release_year: Number(row.release_year),
      total_tracks: Number(row.total_tracks),
      Genre: row.Genre,
      Language: row.Language,
      song_count: Number(row.song_count),
      collection_rate: Number(row.collection_rate),// %
      if_500GreatestAlbums: Number(row.if_500GreatestAlbums),
      if_band: Number(row.if_band),
      if_top30artists: Number(row.if_top30artists)
    };
  });

  return albumInfos;
}
