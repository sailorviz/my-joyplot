// 人性化名称映射
const nameMap = {
  acousticguitar: "Acoustic Guitar",
  piano: "Piano",
  violin: "Violin",
  bass: "Bass",
  flute: "Flute",
  // 可继续添加
};

// 要加载的音频文件名列表（无需扩展名）
const audioFiles = ["acousticguitar", "piano", "violin", "bass", "flute"];

export async function loadInstrumentsData() {
  const instruments = [];

  for (const baseName of audioFiles) {
    const humanName = nameMap[baseName] || baseName;

    // 构造路径
    const audioPath = `audios/instruments/${baseName}.mp3`;
    const cqtPath = `data/instruments/cqt/${baseName}_CQT.json`;
    const hpcpPath = `data/instruments/hpcp/${baseName}_HPCP.json`;

    // 异步 fetch JSON 数据
    const [cqtResp, hpcpResp] = await Promise.all([
      fetch(cqtPath),
      fetch(hpcpPath)
    ]);

    const cqtJson = await cqtResp.json();
    const hpcpJson = await hpcpResp.json();

    instruments.push({
      baseName: baseName,
      name: humanName,
      audio: audioPath,
      cqtData: {
        values: cqtJson.values,
        times: cqtJson.times,
        noteLabels: cqtJson.note_labels
      },
      hpcpData: {
        values: hpcpJson.values,
        times: hpcpJson.times,
        noteLabels: hpcpJson.note_labels
      }
    });
  }

  return instruments;
}