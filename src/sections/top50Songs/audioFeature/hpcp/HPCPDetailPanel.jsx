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
      pitch: '音高'
    },
    en: {
      hoverHint: 'Hover something 👈👈👈👈👈',
      key: 'Key',
      pitch: 'Pitch'
    }
  };
  const t = detailTexts[language] || detailTexts.en;

  const pitchNames = [
    "C","C#","D","D#","E","F",
    "F#","G","G#","A","A#","B"
  ];

  if (!hover) {
    return <div>{t.hoverHint}</div>;
  }

  if (hover.type === "song") {
    const song = songs[hover.songIndex];

    if (!song) return null;

    return (
      <div className="hpcp-song-detail">
        <img
          src={song.coverPath}
          style={{
            width: 100,
            height: 100,
            objectFit: "cover",
            borderRadius: 8
          }}
        />

        <h2>{song.song}</h2>
        <p>{song.artist}</p>
        <p>{song.album}</p>
        <p>{t.key}: {song.key} {song.scale}</p>   {/* ← 翻译 */}
      </div>
    );
  }

  if (hover.type === "pitch") {
    const pitchSongs = pitchToSongsMap[hover.pitchIndex] || [];
    const currentPitch = pitchNames[hover.pitchIndex];

    return (
      <div className="hpcp-pitch-detail">
        <h2>{t.pitch}: {pitchNames[hover.pitchIndex]}</h2>   {/* ← 翻译 */}

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