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

  // 计算all particles' target positions
  // 🆕 STEP 1: 计算三层结构 target positions
  function computeTargets(songs, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;

    // =========================
    // 1. 按 artist 分组
    // =========================
    const artistMap = new Map();

    songs.forEach(song => {
      // 🆕 STEP: extract primary artist only
      const primaryArtist = song.artist
        ? song.artist.split(",")[0].trim()   // 如果是 "A, B, C"
        : "unknown";

      song.primaryArtist = primaryArtist; // 🆕 可选：写回去，方便 debug

      if (!artistMap.has(primaryArtist)) {
        artistMap.set(primaryArtist, []);
      }

      artistMap.get(primaryArtist).push(song);
    });

    const artists = Array.from(artistMap.entries());

    const maxRadius = Math.min(width, height) * 0.28;

    artists.forEach(([artist, list], i) => {

      // =========================
      // 2. artist level（按 top50 density 决定半径）
      // =========================
      const top50Count = list.filter(d => d.ifTop50 === 1).length;
      const strength = top50Count / Math.max(1, list.length);

      // const radius = maxRadius * (0.4 + strength * 0.6);
      const radius = maxRadius * (0.3 + strength * 0.9);

      const angle = (i / artists.length) * Math.PI * 2;

      const ax = centerX + Math.cos(angle) * radius;
      const ay = centerY + Math.sin(angle) * radius;

      // =========================
      // 3. album clustering
      // =========================
      const albumMap = new Map();

      list.forEach(song => {
        if (!albumMap.has(song.album)) {
          albumMap.set(song.album, []);
        }
        albumMap.get(song.album).push(song);
      });

      const albums = Array.from(albumMap.entries());

      albums.forEach(([album, songsInAlbum], j) => {

        const albumAngle = (j / albums.length) * Math.PI * 2;
        // const albumR = 60;
        const albumR = 40 + songsInAlbum.length * 3;

        const bx = ax + Math.cos(albumAngle) * albumR;
        const by = ay + Math.sin(albumAngle) * albumR;

        // =========================
        // 4. song target
        // =========================
        const topSongs = songsInAlbum.filter(s => s.ifTop50 === 1);
        // songsInAlbum.forEach(song => {
        //   // song.targetX = bx + (Math.random() - 0.5) * 20;
        //   // song.targetY = by + (Math.random() - 0.5) * 20;
        // });
        if (topSongs.length > 0) {
          // ⭐ 先给 top50 分配位置（核心点）
          topSongs.forEach((song, k) => {
            const angle = (k / topSongs.length) * Math.PI * 2;
            const r = 10; // 很小，保持紧凑

            song.targetX = bx + Math.cos(angle) * r;
            song.targetY = by + Math.sin(angle) * r;
          });

          // ⭐ 非top50 围绕最近的 top50
          songsInAlbum.forEach(song => {
            if (song.ifTop50 === 1) return;

            // 👉 随机选一个 top50 作为 anchor
            const anchor = topSongs[Math.floor(Math.random() * topSongs.length)];

            const angle = Math.random() * Math.PI * 2;
            const r = 20 + Math.random() * 30;

            song.targetX = anchor.targetX + Math.cos(angle) * r;
            song.targetY = anchor.targetY + Math.sin(angle) * r;
          });

        } else {
          songsInAlbum.forEach(song => {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * 40;

            song.targetX = bx + Math.cos(angle) * r;
            song.targetY = by + Math.sin(angle) * r;
          });
        }

      });
    });

    return songs;
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

        // 🆕 STEP 2: attach target system
        // const enriched = computeTargets(
        //   data,
        //   window.innerWidth,
        //   window.innerHeight
        // );

        // setSongs(enriched);
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
      // flow: 1 - rangeProgress(p, 0.15, 0.25),
      // freeze: rangeProgress(p, 0.15, 0.25),
      // abstraction: rangeProgress(p, 0.25, 0.40),
      // separation: rangeProgress(p, 0.40, 0.55),
      // clustering: rangeProgress(p, 0.55, 0.75),
      // strongSeparation: rangeProgress(p, 0.75, 0.90),
      // breathing: rangeProgress(p, 0.90, 1.00),
      flow: 1 - rangeProgress(p, 0.15, 0.22),
      freeze: rangeProgress(p, 0.15, 0.22),

      abstraction: rangeProgress(p, 0.22, 0.35),
      separation: rangeProgress(p, 0.35, 0.50),

      // ⭐ 拉长
      clustering: rangeProgress(p, 0.50, 0.80),

      strongSeparation: rangeProgress(p, 0.80, 0.92),
      breathing: rangeProgress(p, 0.92, 1.00),
    };
  }

  // initialize particles
  function initParticles(songs, width, height) {
    const random = (min, max) => Math.random() * (max - min) + min;

    return songs.map((song, i) => {

      let x, y;

      // =========================
      // 🟢 EXISTING PARTICLES (0–100)
      // =========================
      if (i < 100) {

        x = random(0, width);
        y = random(0, height);

        // 🆕 标记
        song.isLate = false;
      }

      // =========================
      // 🔵 LATE PARTICLES (100+)
      // =========================
      else {

        // const edge = Math.floor(Math.random() * 4);

        // // 四周初始化（视口外）
        // if (edge === 0) {
        //   x = random(0, width);
        //   y = -80;
        // } 
        // else if (edge === 1) {
        //   x = width + 80;
        //   y = random(0, height);
        // } 
        // else if (edge === 2) {
        //   x = random(0, width);
        //   y = height + 80;
        // } 
        // else {
        //   x = -80;
        //   y = random(0, height);
        // }

        // 🆕 以中心为基准的“外环初始化”
        const centerX = width / 2;
        const centerY = height / 2;

        // 半径：比画布大一圈
        const spawnRadius = Math.max(width, height) * 0.7;

        const angle = Math.random() * Math.PI * 2;

        // 加一点随机扰动（防止太均匀）
        const radiusJitter = spawnRadius * (0.8 + Math.random() * 0.4);

        x = centerX + Math.cos(angle) * radiusJitter;
        y = centerY + Math.sin(angle) * radiusJitter;

        // 🆕 标记
        song.isLate = true;
      }

      return {
        x,
        y,
        initialX: x,
        initialY: y,

        opacity: random(0.3, 0.9),
        speed: random(20, 40),
        fontSize: random(14, 24),
        seed: Math.random() * 1000,

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
    // 🆕 STEP 2: attraction strength（由 clustering 控制）
    const attractionStrength = state.clustering * 0.08;

    particles.forEach((p) => {

      // =====================
      // 1️⃣ STRUCTURE（只由 progress 控制，可 scrub）
      // =====================
      let x = p.initialX;
      let y = p.initialY;

      // state.flow
      if (state.flow > 0 && !p.song.isLate) {
        const motionX = p.speed * time;
        x += motionX;

        // 循环
        const buffer = 200;
        x = ((x) % (width + buffer)) - buffer;
      }

      // state.freeze
      if (state.freeze > 0 && !p.song.isLate && !freezeTriggeredRef.current) {
        particles.forEach(p => {
          p.frozenX = p.x;
          p.frozenY = p.y;
          p.isFrozen = true;
        });

        freezeTriggeredRef.current = true;
      }

      if (state.separation > 0 && state.clustering === 0) {

        const dx = p.song.targetX - x;
        const dy = p.song.targetY - y;

        // ⭐ 很弱的吸引（只是“方向提示”）
        x += dx * 0.01 * state.separation;
        y += dy * 0.01 * state.separation;
      }

      // 校准两组粒子的motion system
      const lateFactor = p.song.isLate ? 0.3 : 1;
      
      if (state.clustering > 0) {

        const dx = p.song.targetX - x;
        const dy = p.song.targetY - y;

        // x += dx * attractionStrength * lateFactor;
        // y += dy * attractionStrength * lateFactor;
        const t = state.clustering; // 0 → 1

        x = p.initialX + (p.song.targetX - p.initialX) * t;
        y = p.initialY + (p.song.targetY - p.initialY) * t;
      }
      /*

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
  function renderEarly(el, p, state, width){
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
  }

  function renderLate(el, p, state, width) {
    const s = state.separation;

    // =========================
    // 🟡 position（直接参与结构系统）
    // =========================
    el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;

    // =========================
    // 🟡 NO TEXT LOGIC（关键）
    // =========================
    el.textContent = "";

    // =========================
    // 🟡 DIRECT DOT MODE（从一开始就是dot）
    // =========================
    const baseColor = "#64748b";
    const targetColor = getSeparationColor(p.song);

    function lerpColor(c1, c2, t) {
      const a = parseInt(c1.slice(1), 16);
      const b = parseInt(c2.slice(1), 16);

      const r = (a >> 16) + ((b >> 16) - (a >> 16)) * t;
      const g = ((a >> 8) & 0xff) + (((b >> 8) & 0xff) - ((a >> 8) & 0xff)) * t;
      const b2 = (a & 0xff) + ((b & 0xff) - (a & 0xff)) * t;

      return `rgb(${r},${g},${b2})`;
    }

    // =========================
    // 🟡 size：直接进入 separation scale
    // =========================
    let size = DOT_CONFIG.size;

    if (p.song.ifTop50 === 1) {
      size *= SIZE_SCALE_TOP50;
    }

    el.style.width = `${size}px`;
    el.style.height = `${size}px`;

    // =========================
    // 🟡 color：直接进入 weak-separation mapping
    // =========================
    el.style.background = lerpColor(baseColor, targetColor, s);

    el.style.borderRadius = "50%";

    // =========================
    // 🟡 opacity：不走 abstraction fade
    // =========================
    el.style.opacity = DOT_CONFIG.opacity;

    // =========================
    // 🟡 layout
    // =========================
    el.style.display = "block";
  }

  function renderParticles(container, particles, progress, width) {
    const children = container.children;
    const state = computeState(progress);
    // 🆕 只在 weak-separation 阶段显示 late particles
    const showLate = state.separation > 0;

    particles.forEach((p, i) => {
      // 分支渲染
      const isEarly = i < 100;
      const isLate = !isEarly;

      const el = children[i];

      // 分开渲染
      if (isEarly) {
        renderEarly(el, p, state, width);
        return;
      }
      renderLate(el, p, state, width);

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

    // 🆕 在 initParticles 之前加
    const enrichedSongs = computeTargets(songs, width, height);

    // 初始化粒子
    particlesRef.current = initParticles(enrichedSongs, width, height);

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

