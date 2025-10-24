import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import Papa from "papaparse";
import "../../styles/FloatingSongs.css";
import { clusterByArtist } from "./clusteringByArtist";

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

  useEffect(() => {
    fetch("/data/2296_all_songs.csv")
      .then((res) => res.text())
      .then((csvText) => {
        const result = Papa.parse(csvText, { header: true });
        const data = result.data.map((row) => `${row.song_name} - ${row.artist}`);
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

    container.innerHTML = "";
    positionsRef.current = [];
    speedRef.current = [];
    indexRef.current = MAX_VISIBLE;
    opacityRef.current = [];

    for (let i = 0; i < MAX_VISIBLE; i++) {
      const el = document.createElement("div");
      el.classList.add("song");
      el.textContent = songs[i];

      el.style.top = `${random(0, height - 30)}px`;
      el.style.left = `${random(0, width)}px`;
      el.style.fontSize = `${random(14, 24)}px`;
      el.style.opacity = `${random(0.3, 0.7)}`;
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
          children[i].textContent = songs[indexRef.current];
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
    animate();

    return () => cancelAnimationFrame(animationRef.current);
  }, [songs]);

  useImperativeHandle(ref, () => ({
    triggerClustering: () => {
      runningRef.current = false; // 暂停动画
      cancelAnimationFrame(animationRef.current);
      clusterByArtist(containerRef.current, songs);
    },
  }));

  return <div ref={containerRef} id="container"></div>;
});

export default FloatingSongs;

