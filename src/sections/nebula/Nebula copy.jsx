import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import Papa from "papaparse";

const Nebula = forwardRef((_, ref) => {
  const [songs, setSongs] = useState([]);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const runningRef = useRef(true); // 动画状态标记
  const MAX_VISIBLE = 100;
  const positionsRef = useRef([]);
  const speedRef = useRef([]);
  const indexRef = useRef(0);
  const opacityRef = useRef([]);
  const animateRef = useRef(null);

  useEffect(() => {
    fetch("/data/2296_all_songs.csv")
      .then((res) => res.text())
      .then((csvText) => {
        const result = Papa.parse(csvText, { header: true });
        // const data = result.data.map((row) => `${row.song_name} - ${row.artist}`);
        const data = result.data.map((row) => ({
          id : row.id,
          name : row.song_name.trim(),
          artist : row.artist.trim(),
          album : row.album.trim()
        }));
        setSongs(data);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (songs.length === 0) return;
    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const random = (min, max) => Math.random() * (max - min) + min;

    if (!container) return;
    container.replaceChildren(); // 比 innerHTML = "" 更安全
    positionsRef.current = [];
    speedRef.current = [];
    indexRef.current = MAX_VISIBLE;
    opacityRef.current = [];

    for (let i = 0; i < MAX_VISIBLE; i++) {
      const song = songs[i]; // ✅ song 是对象 {id, name, artist}
      if (!song) continue;

      const el = document.createElement("div");
      el.className = "song floating-song";
      
      // ✅ 给每个元素加唯一标识
      el.dataset.id = song.id;
      el.dataset.name = song.name;
      el.dataset.artist = song.artist;
      el.dataset.album = song.album;

      // ✅ 文字内容
      el.textContent = `${song.name} - ${song.artist}`;

      el.style.position = "absolute";
      el.style.top = `${random(0, height - 30)}px`;
      el.style.left = `${random(0, width)}px`;
      el.style.fontSize = `${random(14, 24)}px`;
      el.style.opacity = `${random(0.3, 0.9)}`;
      el.style.transition = "opacity 2s";

      container.appendChild(el);
      positionsRef.current.push(parseFloat(el.style.left));
      speedRef.current.push(random(0.2, 0.4));
      opacityRef.current.push(parseFloat(el.style.opacity));
    }

    const animate = () => {
      if (!runningRef.current) return; // 如果暂停，则不再更新
      const children = container.children;
      for (let i = 0; i < children.length; i++) {
        positionsRef.current[i] += speedRef.current[i];
        if (positionsRef.current[i] > width) {
          positionsRef.current[i] = -children[i].offsetWidth;
          children[i].textContent = `${songs[indexRef.current].name} - ${songs[indexRef.current].artist}`;
          children[i].style.top = `${random(0, height - 30)}px`;
          children[i].style.opacity = 0;
          const targetOpacity = random(0.3, 0.7);
          opacityRef.current[i] = targetOpacity;
          setTimeout(() => {
            children[i].style.opacity = targetOpacity;
          }, 50);
          indexRef.current = (indexRef.current + 1) % songs.length;
        }
        children[i].style.left = `${positionsRef.current[i]}px`;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animateRef.current = animate; // ✅ 保存引用
    animate();

    return () => cancelAnimationFrame(animationRef.current);
  }, [songs]);

  useImperativeHandle(ref, () => ({
    pause: () => { runningRef.current = false; cancelAnimationFrame(animationRef.current); },
    resetFloating: () => resetFloating(containerRef, runningRef, animateRef, positionsRef, opacityRef, speedRef, MAX_VISIBLE),
  }));

  return <div ref={containerRef} id="nebula-container"></div>;
});

export default Nebula;

