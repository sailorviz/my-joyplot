import Papa from "papaparse";

export async function loadArtistInfo(csvPath) {
  const response = await fetch(csvPath);
  const csvText = await response.text();

  // 解析 CSV
  const parsed = Papa.parse(csvText, {
    header: true, // 自动把第一行当作表头
    skipEmptyLines: true
  });

  // 转成 { artistName: { ...info } } 结构
  const artistInfos = {};
  parsed.data.forEach(row => {
    const artist = row.name?.trim();
    if (!artist) return; // 跳过空行

    artistInfos[artist] = {
      singer_sex: row.singer_sex,
      singer_birthyear: Number(row.singer_birthyear),
      if_band: Number(row.if_band),
      debut_year: Number(row.debut_year),
      Genre: row.Genre,
      Country: row.Country,
      song_Language: row.song_Language,
      song_count: Number(row.song_count)
    };
  });

  return artistInfos;
}
