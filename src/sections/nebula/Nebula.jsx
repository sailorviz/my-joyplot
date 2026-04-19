import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import Papa from "papaparse";
import * as d3 from "d3-force";

// 0.00 — 0.15  → flowing
// 0.15 — 0.22 → freeze
// 0.22 — 0.35 → text → particles（collapse + abstraction）
// 0.35 — 0.50 → weak separation（top50 vs others）
// 0.50 — 0.80 → clustering（artist + album）
// 0.80 — 0.92 → strong separation（强化结构）
// 0.92 — 1.00 → breathing

const Nebula = forwardRef((_, ref) => {
  const [songs, setSongs] = useState([]);
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const stateRef = useRef({ progress: 0 });
  const animationRef = useRef(null);
  const timeRef = useRef(0); // ⭐ 新增：系统内部时间（breathing专用）
  const interactionRef = useRef({
    hoverId: null,
    hoverArtist: null,
    hoverAlbum: null,
  });
  const INTERACTION_THRESHOLD = 0;

  // ⭐ CONFIG
  const DOT_CONFIG = {
    size: 10,
    opacity: 0.9,
    color: [255, 255, 255] // 🟢 优化：预设为 RGB 数组，避免每一帧解析字符串
  };
  const SIZE_SCALE_TOP50 = 2.0;
  const freezeTriggeredRef = useRef(false);

  // 🟢 优化：颜色预定义为数组，提升计算效率
  const COLOR_MAP = {
    top50: [125, 211, 252], // #7dd3fc
    others: [100, 116, 139] // #64748b
  };

    // ⭐ 新增：tooltip 相关状态
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    song: null,
    sameArtistSongs: [],
    sameAlbumSongs: []
  });
  
  const tooltipRef = useRef(null);

  function isInteractionActive() {
    return stateRef.current.breath > INTERACTION_THRESHOLD;
  }

  function getSeparationColorArr(song) {
    return song.ifTop50 === 1 ? COLOR_MAP.top50 : COLOR_MAP.others;
  }

  // ⭐ 为每个艺术家生成固定的颜色
  function getArtistColor(artistName) {
    // 使用简单的哈希函数生成固定颜色
    let hash = 0;
    for (let i = 0; i < artistName.length; i++) {
      hash = artistName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const h = Math.abs(hash) % 360;
    const s = 70 + (Math.abs(hash >> 8) % 30); // 70-100%
    const l = 55 + (Math.abs(hash >> 16) % 25); // 55-80%
    
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  // 🟢 优化：使用位运算 (| 0) 快速取整，并直接处理数组
  function lerpColor(c1, c2, t) {
    const r = (c1[0] + (c2[0] - c1[0]) * t) | 0;
    const g = (c1[1] + (c2[1] - c1[1]) * t) | 0;
    const b = (c1[2] + (c2[2] - c1[2]) * t) | 0;
    return `rgb(${r},${g},${b})`;
  }

  function computeTargets(songs, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.4;

    // 1. Artist 分组与排序
    const artistMap = new Map();
    songs.forEach(song => {
      const primaryArtist = song.artist ? song.artist.split(",")[0].trim() : "unknown";
      song.primaryArtist = primaryArtist;
      if (!artistMap.has(primaryArtist)) artistMap.set(primaryArtist, []);
      artistMap.get(primaryArtist).push(song);
    });

    const artists = Array.from(artistMap.entries()).sort((a, b) => {
      const aTop = a[1].filter(d => d.ifTop50 === 1).length;
      const bTop = b[1].filter(d => d.ifTop50 === 1).length;
      return bTop - aTop;
    });

    // 2. 确定“多核”结构
    const numMainNuclei = Math.min(6, artists.length);
    const mainNuclei = artists.slice(0, numMainNuclei);
    const minorArtists = artists.slice(numMainNuclei);
    const artistCenters = new Map();

    mainNuclei.forEach(([artist, list], i) => {
      const top50Count = list.filter(d => d.ifTop50 === 1).length;
      const strength = top50Count / Math.max(1, list.length);
      const r = maxRadius * 0.8; 
      const theta = (i / numMainNuclei) * Math.PI * 2;
      artistCenters.set(artist, { 
        x: centerX + Math.cos(theta) * r, 
        y: centerY + Math.sin(theta) * r, 
        z: strength * 50 
      });
    });

    minorArtists.forEach(([artist, list]) => {
      const useCenter = Math.random() < 0.3;
      const refCenter = useCenter 
        ? { x: centerX, y: centerY } 
        : artistCenters.get(mainNuclei[Math.floor(Math.random() * numMainNuclei)][0]);
      const r = maxRadius * (0.4 + Math.random() * 0.7); 
      const theta = Math.random() * Math.PI * 2;
      artistCenters.set(artist, { 
        x: refCenter.x + Math.cos(theta) * r * 0.5, 
        y: refCenter.y + Math.sin(theta) * r * 0.5, 
        z: -20 - Math.random() * 30 
      });
    });

    // 3. Album & Song 布局
    artists.forEach(([artist, list]) => {
      const center = artistCenters.get(artist);
      const albumMap = new Map();
      list.forEach(song => {
        if (!albumMap.has(song.album)) albumMap.set(song.album, []);
        albumMap.get(song.album).push(song);
      });

      const albums = Array.from(albumMap.entries());
      albums.forEach(([album, songsInAlbum], j) => {
        const albumAngle = (j / albums.length) * Math.PI * 2 + (Math.random() * 0.5); 
        const albumR = 20 + Math.sqrt(songsInAlbum.length) * 12;
        const bx = center.x + Math.cos(albumAngle) * albumR;
        const by = center.y + Math.sin(albumAngle) * albumR;

        const topSongs = songsInAlbum.filter(s => s.ifTop50 === 1);
        const otherSongs = songsInAlbum.filter(s => s.ifTop50 === 0);

        topSongs.forEach((song, k) => {
          const angle = (k / Math.max(1, topSongs.length)) * Math.PI * 2;
          const dist = 8 + Math.sqrt(k) * 20; 
          song.baseTargetX = bx + Math.cos(angle) * dist;
          song.baseTargetY = by + Math.sin(angle) * dist;
          song.targetZ = center.z + 25; 
        });

        otherSongs.forEach((song, k) => {
          const layer = k % 4;
          const angle = Math.random() * Math.PI * 2;
          const dist = 20 + layer * 15 + (k % 10) * 10; 
          const refX = topSongs.length > 0 ? topSongs[0].baseTargetX : bx;
          const refY = topSongs.length > 0 ? topSongs[0].baseTargetY : by;
          song.baseTargetX = refX + Math.cos(angle) * dist;
          song.baseTargetY = refY + Math.sin(angle) * dist;
          song.targetZ = center.z - 20; 
        });
      });
    });

    // 🟢 优化：D3-force 只操作 x, y，不创建新对象
    const simulation = d3.forceSimulation(songs)
      .force("collide", d3.forceCollide().radius(d => d.ifTop50 === 1 ? 16 : 7).strength(1.0).iterations(2))
      .force("x", d3.forceX(d => d.baseTargetX).strength(0.15))
      .force("y", d3.forceY(d => d.baseTargetY).strength(0.15))
      .stop();

    // 🟢 优化：减少迭代次数至 120 次，平衡性能与排布质量
    for (let i = 0; i < 120; i++) simulation.tick();

    songs.forEach(song => {
      song.targetX = song.x;
      song.targetY = song.y;
    });

    return songs;
  }

  function computeBreath(breathState, t) {
    if (breathState <= 0) return 0;

    // ⭐ 主呼吸（慢周期）
    const slow = Math.sin(t * 0.6);

    // ⭐ 微扰（让系统“活着”）
    const micro = Math.sin(t * 2.2) * 0.15;

    // ⭐ 状态门控（只在 breathing stage 激活）
    return breathState * (0.5 + 0.5 * slow + micro);
  }

  useEffect(() => {
    fetch("/data/2296_all_songs.csv")
      .then((res) => res.text())
      .then((csvText) => {
        const result = Papa.parse(csvText, { header: true });
        const data = result.data
          .filter(row => row.song_name) // 🟢 防错
          .map((row) => ({
            id : row.id,
            name : row.song_name.trim(),
            artist : row.artist.trim(),
            album : row.album.trim(),
            ifTop50 : row.if_top50 ? +row.if_top50 : 0,
            popularity: row.popularity ? +row.popularity : 0,
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
      flow: 1 - rangeProgress(p, 0.15, 0.22),
      freeze: rangeProgress(p, 0.15, 0.22),
      abstraction: rangeProgress(p, 0.22, 0.35),
      separation: rangeProgress(p, 0.35, 0.50),
      clustering: rangeProgress(p, 0.50, 0.80),
      strongSeparation: rangeProgress(p, 0.80, 0.92),
      breathing: rangeProgress(p, 0.92, 1.00),
    };
  }

  function initParticles(songs, width, height) {
    const random = (min, max) => Math.random() * (max - min) + min;
    return songs.map((song, i) => {
      let x, y;
      if (i < 100) {
        x = random(0, width);
        y = random(0, height);
        song.isLate = false;
      } else {
        const centerX = width / 2;
        const centerY = height / 2;
        const spawnRadius = Math.max(width, height) * 0.7;
        const angle = Math.random() * Math.PI * 2;
        const radiusJitter = spawnRadius * (0.8 + Math.random() * 0.4);
        x = centerX + Math.cos(angle) * radiusJitter;
        y = centerY + Math.sin(angle) * radiusJitter;
        song.isLate = true;
      }
      return {
        x, y, z: 0,
        initialX: x,
        initialY: y,
        opacity: random(0.3, 0.9),
        speed: random(20, 40),
        fontSize: random(14, 24),
        song,
          // ⭐ 新增：每个粒子的呼吸相位偏移（避免同步）
        breathOffset: Math.random() * Math.PI * 2,
      };
    });
  }

  function updateParticles(particles, progress, width, height) {
    const state = computeState(progress);
    const time = performance.now() * 0.001;

    particles.forEach((p) => {
      let x = p.initialX;
      let y = p.initialY;
      let z = 0;

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

      if (state.clustering > 0) {
        const t = state.clustering;
        x = p.initialX + (p.song.targetX - p.initialX) * t;
        y = p.initialY + (p.song.targetY - p.initialY) * t;
        z = (p.song.targetZ || 0) * t;
      }
      
      p.x = x; p.y = y; p.z = z;
    });
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // 🟢 优化：renderEarly 和 renderLate 合并部分逻辑，重点是减少 style 赋值次数
  function renderEarly(el, p, state) {
    const scaleBase = 1 + (p.z || 0) * 0.004;
    const a = state.abstraction;
    const s = state.separation;
    const ss = state.strongSeparation;
    const b = stateRef.current.breath || 0;
    const t = easeInOutCubic(a);
    const interactionActive = isInteractionActive();

    // 🟢 优化：将尺寸变化合并到 scale 中，避免修改 width/height 触发布局重排
    const textScale = 1 - a;
    const dotScale = t;

    let sizeScale = textScale + dotScale;

    if (p.song.ifTop50 === 1) {
      sizeScale *= (1 + (SIZE_SCALE_TOP50 - 1) * s);
    }

    // ⭐ strong separation：popularity 放大
    if (ss > 0) {
      const popScale = 1 + (p.song.popularity || 0) / 100;
      // const popScale = 1 + Math.log(1 + p.song.popularity) / 4;
      sizeScale *= popScale * 1.1;
    }
    // const finalScale = scaleBase * sizeScale * (1 + b*0.5);

    // ⭐ 新增：控制呼吸振幅（建议先保守）
    const BREATH_AMPLITUDE = 0.25;
    const MIN_BREATH_SCALE = 0.6; // ⭐ 新增：最小缩放比例

    // ⭐ 新增：加入 phase offset，让每个粒子不同步
    const phase = b + Math.sin(p.breathOffset) * 0.1;

    // ⭐ 修改：使用正弦函数直接计算，确保始终在合理范围内
    // 将 b (0-1) 映射到缩放范围 (MIN_BREATH_SCALE 到 1 + BREATH_AMPLITUDE)
    const breathScale = MIN_BREATH_SCALE + 
      (1 + BREATH_AMPLITUDE - MIN_BREATH_SCALE) * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));

    const finalScale = scaleBase * sizeScale * breathScale;

    // 🟢 优化：使用 translate3d 开启硬件加速
    el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${finalScale})`;
    el.style.zIndex = (p.z + 100) | 0;

    const textOpacity = p.opacity * (1 - a);
    const dotOpacity = DOT_CONFIG.opacity * t;
    el.style.opacity = Math.min(1, (textOpacity + dotOpacity) * (0.92 + b * 0.08));

    // 🟢 优化：只有在必要阶段才更新颜色和文字属性
    if (a < 1) {
      el.style.fontSize = `${p.fontSize * (1 - a)}px`;
      el.style.color = `rgba(255,255,255,${1 - a})`;
    }

    let baseColor;
    if (t > 0) {
      const targetColor = getSeparationColorArr(p.song);
      baseColor = lerpColor(DOT_CONFIG.color, targetColor, s);
    } else {
      baseColor = "transparent";
    }

    const interaction = interactionRef.current;

    if (interactionActive && interaction.hoverId) {
      const isSelf = p.song.id === interaction.hoverId;
      const isSameArtist = p.song.primaryArtist === interaction.hoverArtist;
      const isSameAlbum = p.song.album === interaction.hoverAlbum;
      
      if (isSelf) {
        // 1. 当前 hover 的粒子：使用艺术家颜色 + 强边框高亮
        const artistColor = getArtistColor(p.song.primaryArtist);
        el.style.background = artistColor;
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 0 20px rgba(255,255,255,0.9)";
        el.style.opacity = "1";
        el.style.zIndex = "999";
      } 
      else if (isSameArtist) {
        // 2. 同艺术家的其他粒子：该艺术家的颜色
        const artistColor = getArtistColor(p.song.primaryArtist);
        el.style.background = artistColor;
        el.style.border = "1px solid rgba(255,255,255,0.4)";
        el.style.boxShadow = "0 0 8px rgba(255,255,255,0.3)";
        el.style.opacity = "0.9";
      } 
      else if (isSameAlbum) {
        // 3. 同专辑但不同艺术家：各自艺术家的颜色
        const artistColor = getArtistColor(p.song.primaryArtist);
        el.style.background = artistColor;
        el.style.border = "1px dashed rgba(255,255,255,0.3)";
        el.style.boxShadow = "none";
        el.style.opacity = "0.7";
      } 
      else {
        // 4. 其他不相关的粒子：变暗
        el.style.background = baseColor;
        el.style.border = "none";
        el.style.boxShadow = "none";
        el.style.opacity = "0.15";
      }
    } else {
      // 无 hover 状态：恢复默认
      el.style.background = baseColor;
      el.style.border = "none";
      el.style.boxShadow = "none";
    }
  }

  function renderLate(el, p, state) {
    const scaleBase = 1 + (p.z || 0) * 0.004;
    const s = state.separation;
    const ss = state.strongSeparation;
    const b = stateRef.current.breath || 0;
    const interactionActive = isInteractionActive();

    // Late 粒子始终是点，缩放只需考虑深度
    let sizeScale = 1;
    if (p.song.ifTop50 === 1) sizeScale = SIZE_SCALE_TOP50;
    // ⭐ strong separation：popularity 放大
    if (ss > 0) {
      const popScale = 1 + (p.song.popularity || 0) / 100;
      // const popScale = 1 + Math.log(1 + p.song.popularity) / 4;
      sizeScale *= popScale * 1.1;
    }

    const BREATH_AMPLITUDE = 0.25;
    const MIN_BREATH_SCALE = 0.6; // ⭐ 新增：最小缩放比例

    // ⭐ Late 粒子同样加入 phase offset
    const phase = b + Math.sin(p.breathOffset) * 0.1;

    // ⭐ 修改：使用正弦函数直接计算，确保始终在合理范围内
    // 将 b (0-1) 映射到缩放范围 (MIN_BREATH_SCALE 到 1 + BREATH_AMPLITUDE)
    const breathScale = MIN_BREATH_SCALE + 
      (1 + BREATH_AMPLITUDE - MIN_BREATH_SCALE) * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));

    const finalScale = scaleBase * sizeScale * breathScale;

    el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${finalScale})`;
    el.style.zIndex = (p.z + 100) | 0;
    el.style.opacity = DOT_CONFIG.opacity;

    let baseColor;   
    if (s > 0) {
      const targetColor = getSeparationColorArr(p.song);
      baseColor = lerpColor([100, 116, 139], targetColor, s);
    } 

    const interaction = interactionRef.current;

    if (interactionActive && interaction.hoverId) {
      const isSelf = p.song.id === interaction.hoverId;
      const isSameArtist = p.song.primaryArtist === interaction.hoverArtist;
      const isSameAlbum = p.song.album === interaction.hoverAlbum;
      
      if (isSelf) {
        // 1. 当前 hover 的粒子：艺术家颜色 + 强边框
        const artistColor = getArtistColor(p.song.primaryArtist);
        el.style.background = artistColor;
        el.style.border = "3px solid white";
        el.style.boxShadow = "0 0 20px rgba(255,255,255,0.9)";
        el.style.opacity = "1";
        el.style.zIndex = "999";
      } 
      else if (isSameArtist) {
        // 2. 同艺术家的其他粒子
        const artistColor = getArtistColor(p.song.primaryArtist);
        el.style.background = artistColor;
        el.style.border = "1px solid rgba(255,255,255,0.4)";
        el.style.boxShadow = "0 0 8px rgba(255,255,255,0.3)";
        el.style.opacity = "0.9";
      } 
      else if (isSameAlbum) {
        // 3. 同专辑但不同艺术家
        const artistColor = getArtistColor(p.song.primaryArtist);
        el.style.background = artistColor;
        el.style.border = "1px dashed rgba(255,255,255,0.3)";
        el.style.boxShadow = "none";
        el.style.opacity = "0.7";
      } 
      else {
        // 4. 其他不相关的粒子
        el.style.background = baseColor;
        el.style.border = "none";
        el.style.boxShadow = "none";
        el.style.opacity = "0.15";
      }
    } else {
      // 无 hover 状态
      el.style.background = baseColor;
      el.style.border = "none";
      el.style.boxShadow = "none";
    }
  }

  // 🟢 优化：循环内部减少计算
  function renderParticles(container, particles, progress) {
    const children = container.children;
    const state = computeState(progress);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const el = children[i];
      if (i < 100) {
        renderEarly(el, p, state);
      } else {
        renderLate(el, p, state);
      }
    }
  }

  useEffect(() => {
    if (songs.length === 0) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const { width, height } = rect;

    const enrichedSongs = computeTargets(songs, width, height);
    particlesRef.current = initParticles(enrichedSongs, width, height);

    // 🟢 优化：使用 DocumentFragment 批量创建 DOM
    const fragment = document.createDocumentFragment();
    container.replaceChildren();

    particlesRef.current.forEach((p, i) => {
      const el = document.createElement("div");
      el.className = "song floating-song";
      // 🟢 优化：设置 will-change 告知浏览器提前优化
      el.style.cssText = `
        position: absolute;
        width: ${DOT_CONFIG.size}px;
        height: ${DOT_CONFIG.size}px;
        border-radius: 50%;
        background: white;
        will-change: transform, opacity;
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        pointer-events: auto;
      `;
      if (i < 100) el.textContent = `${p.song.name} - ${p.song.artist}`;
      fragment.appendChild(el);

      // el.onmouseenter = () => {
      //   if (!isInteractionActive()) return;

      //   const song = p.song;
      //   interactionRef.current.hoverId = song.id;
      //   interactionRef.current.hoverArtist = song.primaryArtist;
      //   interactionRef.current.hoverAlbum = song.album;
      // };

      // el.onmouseleave = () => {
      //   interactionRef.current.hoverId = null;
      //   interactionRef.current.hoverArtist = null;
      //   interactionRef.current.hoverAlbum = null;
      // };
      el.onmouseenter = (e) => {
      if (!isInteractionActive()) return;

      const song = p.song;
      interactionRef.current.hoverId = song.id;
      interactionRef.current.hoverArtist = song.primaryArtist;
      interactionRef.current.hoverAlbum = song.album;
      
      // ⭐ 新增：收集 tooltip 数据
      const sameArtistSongs = particlesRef.current
        .filter(particle => particle.song.primaryArtist === song.primaryArtist)
        .map(particle => particle.song.name)
        .slice(0, 10); // 最多显示10首
      
      const sameAlbumSongs = particlesRef.current
        .filter(particle => 
          particle.song.album === song.album && 
          particle.song.primaryArtist !== song.primaryArtist
        )
        .map(particle => ({
          name: particle.song.name,
          artist: particle.song.primaryArtist
        }))
        .slice(0, 10); // 最多显示10首
      
      // ⭐ 更新 tooltip 状态
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        song: song,
        sameArtistSongs,
        sameAlbumSongs
      });
    };

    el.onmouseleave = () => {
      interactionRef.current.hoverId = null;
      interactionRef.current.hoverArtist = null;
      interactionRef.current.hoverAlbum = null;
      
      // ⭐ 隐藏 tooltip
      setTooltip(prev => ({ ...prev, visible: false }));
    };

    // ⭐ 新增：鼠标移动时更新 tooltip 位置
    el.onmousemove = (e) => {
      if (tooltip.visible) {
        setTooltip(prev => ({
          ...prev,
          x: e.clientX,
          y: e.clientY
        }));
      }
    };
    });
    container.appendChild(fragment);

    function loop() {
      const p = stateRef.current.progress;
      const state = computeState(p);
      const BREATH_SPEED = 2.5; // ⭐ 先试这个值（默认你现在大概是 1）

      // ⭐ 1. 只在 breathing stage 才推进 internal time
      if (state.breathing > 0) {
        // timeRef.current += 0.016; // approx 60fps fixed step
        timeRef.current += 0.016 * BREATH_SPEED;
      }

      // ⭐ 2. 计算 autonomous breathing（关键新增）
      const breath = computeBreath(state.breathing, timeRef.current);

      // ⭐ 3. 存入全局 state（供 render 使用）
      stateRef.current.breath = breath;
      updateParticles(particlesRef.current, p, width, height);
      renderParticles(container, particlesRef.current, p);
      animationRef.current = requestAnimationFrame(loop);

      // 退出清空
      if (!isInteractionActive() && interactionRef.current.hoverId) {
        interactionRef.current.hoverId = null;
        interactionRef.current.hoverArtist = null;
        interactionRef.current.hoverAlbum = null;
      }
    }

    loop();
    return () => cancelAnimationFrame(animationRef.current);
  }, [songs]);

  // 在组件中添加
  useEffect(() => {
    if (tooltip.visible && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newX = tooltip.x + 15;
      let newY = tooltip.y - 10;
      
      // 防止超出右边界
      if (newX + rect.width > viewportWidth) {
        newX = tooltip.x - rect.width - 15;
      }
      
      // 防止超出下边界
      if (newY + rect.height > viewportHeight) {
        newY = tooltip.y - rect.height - 10;
      }
      
      // 防止超出上边界
      if (newY < 0) {
        newY = 10;
      }
      
      if (newX !== tooltip.x + 15 || newY !== tooltip.y - 10) {
        setTooltip(prev => ({ ...prev, adjustedX: newX, adjustedY: newY }));
      }
    }
  }, [tooltip.visible, tooltip.x, tooltip.y]);

  useImperativeHandle(ref, () => ({
    setProgress(p) {
      stateRef.current.progress = p;
    },
  }));


  return (
    <div ref={containerRef} id="nebula-container">     
      {tooltip.visible && tooltip.song && (
        <div
          ref={tooltipRef}
          className="nebula-tooltip"
          style={{
            left: (tooltip.adjustedX ?? tooltip.x + 25) + "px",
            top: (tooltip.adjustedY ?? tooltip.y - 10) + "px",
          }}
        >
          <div className="tooltip-header">
            <div 
              className="tooltip-song-name"
              style={{ color: getArtistColor(tooltip.song.primaryArtist) }}
            >
              {tooltip.song.name}
            </div>
            <div className="tooltip-artist-album">
              {tooltip.song.artist} • {tooltip.song.album}
            </div>
            {tooltip.song.popularity > 0 && (
              <div className="tooltip-popularity">
                Popularity: {tooltip.song.popularity}
              </div>
            )}
          </div>
          
          {tooltip.sameArtistSongs.length > 1 && (
            <div className="tooltip-section">
              <div className="tooltip-section-title">
                Same Artist ({tooltip.sameArtistSongs.length} songs)
              </div>
              <div className="tooltip-song-list">
                {tooltip.sameArtistSongs
                  .filter(name => name !== tooltip.song.name)
                  .map((name, idx) => (
                    <div key={idx} className="tooltip-song-item">{name}</div>
                  ))}
              </div>
            </div>
          )}
          
          {tooltip.sameAlbumSongs.length > 0 && (
            <div className="tooltip-section">
              <div className="tooltip-section-title">
                Same Album (other artists)
              </div>
              <div className="tooltip-song-list">
                {tooltip.sameAlbumSongs.map((item, idx) => (
                  <div key={idx} className="tooltip-album-song-item">
                    <span>{item.name}</span>
                    <span className="tooltip-artist-name">— {item.artist}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default Nebula;


