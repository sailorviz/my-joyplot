import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import Papa from "papaparse";
import { triggerClustering } from "./triggerClustering/top30Artists/triggerClustering";
import { resetFloating } from "./triggerClustering/top30Artists/resetFloating";
import { animateClusterWithImages } from "./triggerClustering/top30Artists/animateClusterWithImage";
import { hideImages } from "./triggerClustering/top30Artists/hideImages";
import { focusTop1Artist } from "./triggerClustering/top30Artists/focusTop1Artist";
import { cancelFocusCluster } from "./triggerClustering/top30Artists/cancelFocusCluster";
import { loadArtistInfo } from "./triggerClustering/top30Artists/loadArtistInfo";
import { highlightBands } from "./triggerClustering/top30Artists/highlightBands";
import { cancelHighlightBands } from "./triggerClustering/top30Artists/cancelHighlightBands";
import { triggerPlottingTimeline } from "./triggerClustering/top30Artists/triggerPlottingTimeline";
import { timelineToLastStep } from "./triggerClustering/top30Artists/timelineToLastStep"; 
import { triggerClusterTimezone } from "./triggerClustering/top30Artists/triggerClusterTimezone";
import { dropClustersToTimeline } from "./triggerClustering/top30Artists/dropClustersToTimeline";
import { dropClusterToMap } from "./triggerClustering/top30Artists/dropClusterToMap";
import { backToTimeline } from "./triggerClustering/top30Artists/backToTimeline";
import { backToMap } from "./triggerClustering/top30Artists/backToMap";
import { triggerClusteringByAlbum } from "./triggerClustering/top30Albums/triggerClusteringByAlbum";
import { loadAlbumInfo } from "./triggerClustering/top30Albums/loadAlbumInfo";
import { animateClusterOfAlbumWithImage } from "./triggerClustering/top30Albums/animateClusterOfAlbumWithImage";
import { hideCovers } from "./triggerClustering/top30Albums/hideCovers";
import { focusTop1Album } from "./triggerClustering/top30Albums/focusTop1Album";
import { cancelFocusClusterOfAlbum } from "./triggerClustering/top30Albums/cancelFocusClusterOfAlbum";
import { animateClusterCompare } from "./triggerClustering/top30Albums/animateClusterCompare";
import { load500GreatestAlbums } from "./triggerClustering/top30Albums/load500GreatestAlbums";
import { cancelComparing } from "./triggerClustering/top30Albums/cancelComparing";
import { highlightAlbumFromBand } from "./triggerClustering/top30Albums/highlightAlbumFromBand";
import { triggerPlottingTimelineForAlbums } from "./triggerClustering/top30Albums/triggerPlottingTimelineForAlbums";
import { timelineOfAlbumToLastStep } from "./triggerClustering/top30Albums/timelineOfAlbumToLastStep";
import { triggerClusterTimezoneOfAlbum } from "./triggerClustering/top30Albums/triggerClusterTimezoneOfAlbum";
import { clustersJumpingOut } from "./triggerClustering/top30Albums/clustersJumpingOut";
import { backToAlbumTimeline } from "./triggerClustering/top30Albums/backToAlbumTimeline";
import { continueToJumpOutB } from "./triggerClustering/top30Albums/continueToJumpOutB";
import { backToInitialJumping } from "./triggerClustering/top30Albums/backToInitialJumping";
import { continueToJumpOutFamily } from "./triggerClustering/top30Albums/continueToJumpOutFamily";
import { backToInitialJumpingF } from "./triggerClustering/top30Albums/backToInitialJumpingF";

const FloatingSongs = forwardRef((_, ref) => {
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
  const timelineContextRef = useRef(null);
  const hoverVersionRef = useRef(0);
  const albumTimelineContextRef = useRef(null);

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

  const [artistInfos, setArtistInfos] = useState(null);
  useEffect(() => {
    async function fetchArtistInfos() {
      const data = await loadArtistInfo("/data/top30_artists.csv");
      setArtistInfos(data);
    }
    fetchArtistInfos();
  }, []);

  const [albumInfos, setAlbumInfos] = useState(null);
  useEffect(() => {
    async function fetchAlbumInfos() {
      const data = await loadAlbumInfo("/data/top30_albums.csv");
      setAlbumInfos(data);
    }
    fetchAlbumInfos();
  }, []);

  const [greatestAlbumInfos, setGreatestAlbumInfos] = useState(null);
  useEffect(() => {
    async function fetchGreatestAlbumInfos() {
      const data = await load500GreatestAlbums("/data/RollingStone_500GreatestAlbums_2023edition.csv");
      setGreatestAlbumInfos(data);
    }
    fetchGreatestAlbumInfos();
  }, []);

  useImperativeHandle(ref, () => ({
    pause: () => { runningRef.current = false; cancelAnimationFrame(animationRef.current); },
    resetFloating: () => resetFloating(containerRef, runningRef, animateRef, positionsRef, opacityRef, speedRef, MAX_VISIBLE),
    triggerClustering: () => triggerClustering(containerRef, songs),
    animateClusterWithImages: () => animateClusterWithImages(containerRef, songs, artistInfos),
    hideImages: () => hideImages(containerRef.current),
    focusTop1Artist: () => focusTop1Artist(containerRef.current, artistInfos),
    cancelFocusCluster: () => cancelFocusCluster(containerRef.current),
    highlightBands: () => highlightBands(containerRef.current, artistInfos),
    cancelHighlightBands: () => cancelHighlightBands(containerRef.current),
    triggerPlottingTimeline: () => {
      const context = triggerPlottingTimeline(containerRef, artistInfos);
      timelineContextRef.current = context; // 存起来
    },
    timelineToLastStep: () => timelineToLastStep(containerRef, artistInfos, songs),
    triggerClusterTimezone : () => triggerClusterTimezone(timelineContextRef.current, artistInfos, containerRef),
    dropClustersToTimeline : () => dropClustersToTimeline(containerRef, artistInfos),
    dropClusterToMap : () => dropClusterToMap(containerRef, artistInfos, hoverVersionRef),
    backToTimeline : () => backToTimeline(containerRef),
    backToMap : () => backToMap(containerRef, MAX_VISIBLE),
    triggerClusteringByAlbum : () => triggerClusteringByAlbum(containerRef, songs),
    animateClusterOfAlbumWithImage : () => animateClusterOfAlbumWithImage(containerRef, songs, albumInfos),
    hideCovers : () => hideCovers(containerRef.current),
    focusTop1Album : () => focusTop1Album(containerRef.current, albumInfos),
    cancelFocusClusterOfAlbum : () => cancelFocusClusterOfAlbum(containerRef.current),
    animateClusterCompare : () => animateClusterCompare(containerRef, albumInfos, greatestAlbumInfos),
    cancelComparing : () => cancelComparing(containerRef.current),
    highlightAlbumFromBand : () => highlightAlbumFromBand(containerRef.current, albumInfos),
    triggerPlottingTimelineForAlbums : () => {
      const albumContext = triggerPlottingTimelineForAlbums(containerRef, albumInfos);
      albumTimelineContextRef.current = albumContext;
    },
    timelineOfAlbumToLastStep : () => timelineOfAlbumToLastStep(containerRef),
    triggerClusterTimezoneOfAlbum : () => triggerClusterTimezoneOfAlbum(albumTimelineContextRef.current, albumInfos, containerRef),
    clustersJumpingOut : () => clustersJumpingOut(containerRef, albumInfos),
    backToAlbumTimeline : () => backToAlbumTimeline(containerRef, albumInfos),
    continueToJumpOutB : () => continueToJumpOutB(containerRef, albumInfos),
    backToInitialJumping : () => backToInitialJumping(containerRef),
    continueToJumpOutFamily : () => continueToJumpOutFamily(containerRef, albumInfos),
    backToInitialJumpingF : () => backToInitialJumpingF(containerRef)
  }));

  return <div ref={containerRef} id="container"></div>;
});

export default FloatingSongs;

