import { useLanguage } from "../../../../components/LanguageContext";

export default function HPCPDetailPanel({
  hover,
  songs,
  pitchToSongsMap
}) {
  const { language } = useLanguage();

  const detailTexts = {
    zh: {
      hoverHint: '👈👈👈 悬停到圆圈上',
      key: '调性',
      pitch: '音高',
      fanArea: '扇形区域 = 一首歌',      // 从第一个组件移过来
      ringArea: '环形区域 = 一个音高类别'  // 从第一个组件移过来
    },
    en: {
      hoverHint: 'Hover something 👈👈👈👈👈',
      key: 'Key',
      pitch: 'Pitch',
      fanArea: 'Fan-shaped area = one song',      // 从第一个组件移过来
      ringArea: 'Circular area = one pitch class'  // 从第一个组件移过来
    }
  };
  const t = detailTexts[language] || detailTexts.en;

  const pitchNames = [
    "C","C#","D","D#","E","F",
    "F#","G","G#","A","A#","B"
  ];

  if (!hover) {
    return (
      <div>
        <div className="area-illustration">
          {t.fanArea}<br />
          {t.ringArea}
        </div>
        <br />
        <br />
        {t.hoverHint}
      </div>
    );
  }

  if (hover.type === "song") {
    const song = songs[hover.songIndex];

    if (!song) return null;

    return (
      <div className="hpcp-song-detail">
        <strong>{song.song}</strong>
        
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            padding: "8px 0",
            marginTop: "8px"
          }}
        >
          <img
            src={song.coverPath}
            style={{
              width: 80,
              height: 80,
              objectFit: "cover",
              borderRadius: 8,
              flexShrink: 0
            }}
            alt={song.song}
          />

          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {song.artist}
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
              {song.album}
            </div>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
              {t.key}: {song.key} {song.scale}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hover.type === "pitch") {
    const pitchSongs = pitchToSongsMap[hover.pitchIndex] || [];
    const currentPitch = pitchNames[hover.pitchIndex];

    return (
      <div className="hpcp-pitch-detail">
        <strong>{t.pitch}: {pitchNames[hover.pitchIndex]}</strong>   {/* ← 翻译 */}

        {pitchSongs.map((s, i) => {
          const isMatch = s.key === currentPitch;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                padding: "4px 0",
                background: isMatch ? "rgba(255, 200, 0, 0.15)" : "transparent",
              }}
            >
              <img
                src={s.coverPath}
                style={{
                  width: 42,
                  height: 42,
                  objectFit: "cover",
                  borderRadius: 6,
                  flexShrink: 0
                }}
              />

              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {s.song}
                </div>

                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {s.artist}
                </div>

                <div style={{ fontSize: 11, opacity: 0.6 }}>
                  Key: {s.key}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}