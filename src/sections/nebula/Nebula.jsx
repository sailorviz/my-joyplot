import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import Papa from "papaparse";
import { color } from "d3";

// 0.00 — 0.15  → flowing
// 0.15 — 0.25 → freeze
// 0.25 — 0.40 → text → particles（collapse + abstraction）
// 0.40 — 0.55 → weak separation（top50 vs others）
// 0.55 — 0.75 → clustering（artist + album）
// 0.75 — 0.90 → strong separation（强化结构）
// 0.90 — 1.00 → breathing

const Nebula = forwardRef((_, ref) => {
  const [songs, setSongs] = useState([]);
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const stateRef = useRef({
    progress: 0
  });
  const animationRef = useRef(null);
  // ⭐ ABSTRACTION DOT CONFIG
  const DOT_CONFIG = {
    size: 10,               // dot 基础大小（核心）
    opacity: 0.7,          // dot 最大不透明度
    color: "#ffffff"
  };
  const freezeTriggeredRef = useRef(false);

  // ⭐ SEPARATION CONFIG（新增）
  const SIZE_SCALE_TOP50 = 2.0;

  // 颜色映射采用mood color mapping or 在focus时采用三圈颜色 or 渐变填充？
  // 在弱区分的时候就简单两种颜色区分即可
  function getSeparationColor(song) {
    return song.ifTop50 === 1 ? "#7dd3fc" : "#64748b";
  }

  // import infos of all songs
  useEffect(() => {
    fetch("/data/2296_all_songs.csv")
      .then((res) => res.text())
      .then((csvText) => {
        const result = Papa.parse(csvText, { header: true });
        const data = result.data.map((row) => ({
          id : row.id,
          name : row.song_name.trim(),
          artist : row.artist.trim(),
          album : row.album.trim(),
          popularity : row.song_popularity ? +row.song_popularity : NaN,
          // ifInfoCollected : row.if_info_collected ? +if_info_collected : NaN,
          ifTop50 : row.if_top50 ? +row.if_top50 : NaN,
        }));
        setSongs(data);
      })
      .catch((err) => console.error(err));
  }, []);

  function rangeProgress(p, start, end) {
    if (p <= start) return 0;
    if (p >= end) return 1;
    return (p - start) / (end - start);
  }

  function computeState(p) {
    return {
      flow: 1 - rangeProgress(p, 0.15, 0.25),
      freeze: rangeProgress(p, 0.15, 0.25),
      abstraction: rangeProgress(p, 0.25, 0.40),
      separation: rangeProgress(p, 0.40, 0.55),
      clustering: rangeProgress(p, 0.55, 0.75),
      strongSeparation: rangeProgress(p, 0.75, 0.90),
      breathing: rangeProgress(p, 0.90, 1.00),
    };
  }

  // initialize particles
  function initParticles(songs, width, height) {
    const random = (min, max) => Math.random() * (max - min) + min;

    return songs.slice(0, 100).map((song, i) => {
      const x = random(0, width);
      const y = random(0, height);

      return {
        x,
        y,
        initialX: x,
        initialY: y,

        opacity: random(0.3, 0.9),
        speed: random(20, 40),  // px/frame（和第二份一致）
        fontSize: random(14, 24),
        seed: Math.random() * 1000, // 扰动

        song,

        frozenX: null,
        frozenY: null,
        isFrozen: false,
      };
    });
  }

  // update particles' position
  function updateParticles(particles, progress, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;

    const state = computeState(progress);

    // ⭐ 新增：time（用于持续运动）
    const time = performance.now() * 0.001;

    particles.forEach((p) => {

      // =====================
      // 1️⃣ STRUCTURE（只由 progress 控制，可 scrub）
      // =====================
      let x = p.initialX;
      let y = p.initialY;

      // state.flow
      if (state.flow > 0) {
        const motionX = p.speed * time;
        x += motionX;

        // 循环
        const buffer = 200;
        x = ((x) % (width + buffer)) - buffer;
      }

      // state.freeze
      // if (state.freeze > 0) {
      //   particles.forEach(p => {
      //     if (!p.isFrozen) {
      //       p.frozenX = p.x;
      //       p.frozenY = p.y;
      //       p.isFrozen = true;
      //     }
      //   });
      // }
      if (state.freeze > 0 && !freezeTriggeredRef.current) {
        particles.forEach(p => {
          p.frozenX = p.x;
          p.frozenY = p.y;
          p.isFrozen = true;
        });

        freezeTriggeredRef.current = true;
      }


      // =====================
      // 🚫 暂时关闭其他 state（专注 flow）
      // =====================
      /*
      if (state.separation > 0) {
        const offset = p.song.ifTop50 ? -80 : 80;
        x += offset * state.separation;
      }

      if (state.clustering > 0) {
        x += (centerX - x) * 0.1 * state.clustering;
        y += (centerY - y) * 0.1 * state.clustering;
      }

      if (state.breathing > 0) {
        const t = performance.now() * 0.002;
        x += Math.sin(t + p.seed) * 3 * state.breathing;
        y += Math.cos(t + p.seed) * 3 * state.breathing;
      }
      */

      // =====================
      // 应用
      // =====================
      p.x = x;
      p.y = y;
    });
  }

  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // render particles
  // function renderParticles(container, particles, progress, width) {
  //   const children = container.children;
  //   const state = computeState(progress);

  //   particles.forEach((p, i) => {
  //     const el = children[i];

  //     // =========================
  //     // ① position（不变）
  //     // =========================
  //     el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;

  //     const a = state.abstraction;

  //     // =========================
  //     // ② TEXT（保持原设计，只 fade）
  //     // =========================
  //     const textOpacity = p.opacity * (1 - a);

  //     el.style.opacity = textOpacity;
  //     el.style.color = `rgba(255,255,255,${1 - a})`;
  //     el.style.fontSize = `${p.fontSize * (1 - a)}px`;

  //     // =========================
  //     // ⭐ ③ DOT（渐进出现，关键修改）
  //     // =========================

  //     // ⭐ easing（让生长更自然）
  //     const t = easeInOutCubic(a);

  //     // ⭐ size 从 0 → DOT_CONFIG.size
  //     const size = DOT_CONFIG.size * t;

  //     el.style.width = `${size}px`;
  //     el.style.height = `${size}px`;

  //     // ⭐ dot 视觉
  //     el.style.background = DOT_CONFIG.color;
  //     el.style.borderRadius = "50%";

  //     // ⭐ opacity 渐变
  //     const dotOpacity = DOT_CONFIG.opacity * t;

  //     // ⭐ 合成 opacity（防止超过1）
  //     el.style.opacity = Math.min(1, textOpacity + dotOpacity);

  //     // =========================
  //     // ④ 保持居中（不变）
  //     // =========================
  //     el.style.display = "flex";
  //     el.style.alignItems = "center";
  //     el.style.justifyContent = "center";
  //   });
  // }
  function renderParticles(container, particles, progress, width) {
    const children = container.children;
    const state = computeState(progress);

    particles.forEach((p, i) => {
      const el = children[i];

      // =========================
      // ① position（不变）
      // =========================
      el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;

      const a = state.abstraction;
      const s = state.separation; // ⭐ 新增（0.40–0.55）

      // =========================
      // ② TEXT（保持原设计，只 fade）
      // =========================
      const textOpacity = p.opacity * (1 - a);

      el.style.opacity = textOpacity;
      el.style.color = `rgba(255,255,255,${1 - a})`;
      el.style.fontSize = `${p.fontSize * (1 - a)}px`;

      // =========================
      // ③ DOT（abstraction 阶段）
      // =========================

      const t = easeInOutCubic(a);

      // =========================
      // ⭐ SIZE（加入 separation 放大）
      // =========================
      let size = DOT_CONFIG.size * t;

      if (p.song.ifTop50 === 1) {
        const targetSize = DOT_CONFIG.size * SIZE_SCALE_TOP50;
        size = size + (targetSize - size) * s; // ⭐ 随 separation 渐变
      }

      el.style.width = `${size}px`;
      el.style.height = `${size}px`;

      // =========================
      // ⭐ COLOR（加入 separation 渐变）
      // =========================
      const baseColor = DOT_CONFIG.color;
      const targetColor = getSeparationColor(p.song);

      function lerpColor(c1, c2, t) {
        const a = parseInt(c1.slice(1), 16);
        const b = parseInt(c2.slice(1), 16);

        const r = (a >> 16) + ((b >> 16) - (a >> 16)) * t;
        const g = ((a >> 8) & 0xff) + (((b >> 8) & 0xff) - ((a >> 8) & 0xff)) * t;
        const b2 = (a & 0xff) + ((b & 0xff) - (a & 0xff)) * t;

        return `rgb(${r},${g},${b2})`;
      }

      el.style.background = lerpColor(baseColor, targetColor, s);

      el.style.borderRadius = "50%";

      // =========================
      // ④ opacity（不改 separation）
      // =========================
      const dotOpacity = DOT_CONFIG.opacity * t;
      el.style.opacity = Math.min(1, textOpacity + dotOpacity);

      // =========================
      // ⑤ 保持居中（不变）
      // =========================
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
    });
  }

  // animation loop
  useEffect(() => {
    if (songs.length === 0) return;

    freezeTriggeredRef.current = false; // ✔ 每次数据重建时重置
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // 初始化粒子
    particlesRef.current = initParticles(songs, width, height);

    // 初始化 DOM
    container.replaceChildren();

    particlesRef.current.forEach((p) => {
      const el = document.createElement("div");
      el.className = "song floating-song";
      el.textContent = `${p.song.name} - ${p.song.artist}`;
      el.style.position = "absolute";
      el.style.opacity = p.opacity;
      container.appendChild(el);
    });

    function loop() {
      const particles = particlesRef.current;
      const p = stateRef.current.progress;

      updateParticles(particles, p, width, height);
      renderParticles(container, particles, p, width);

      animationRef.current = requestAnimationFrame(loop);
    }

    loop();

    return () => cancelAnimationFrame(animationRef.current);
  }, [songs]);


  useImperativeHandle(ref, () => ({
    setProgress(p) {
      stateRef.current.progress = p;
    },
  }));

  return <div ref={containerRef} id="nebula-container"></div>;
});

export default Nebula;

