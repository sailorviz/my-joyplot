
export function createSongInteractionController({ tooltip, kdeCharts }) {
  const interactionState = {
    hover: null,      // { song, artist, feature, value }
    reference: null,  // { song, feature, value }
    playingDiv: null
  };

  function notify() {
    Object.values(kdeCharts).forEach(chart => {
      chart.updateFromState?.(interactionState);
    });
  }

  let currentAudio = null;

  function bind(div) {
    if (div.dataset.interactionBound) return;
    div.dataset.interactionBound = "true";

    div.addEventListener("mouseenter", e => onHoverIn(div, e));
    div.addEventListener("mouseleave", () => onHoverOut(div));
    div.addEventListener("click", () => onClick(div));
  }

  function onHoverIn(div, e) {
    div.classList.add("hovered");

    const feature = div.dataset.featureKey;
    const value = +div.dataset[feature];

    interactionState.hover = {
      song: div.dataset.song,
      artist: div.dataset.artist,
      feature,
      value
    };

    notify();

    // tooltip 保留（这是 UI，不是状态）
    let tooltipHtml = `<strong>${div.dataset.song}</strong><br/>${div.dataset.artist}<br>${feature}: ${value.toFixed(3)}`;

    if (interactionState.reference && interactionState.reference.feature === feature) {
      tooltipHtml += `<br>Δ vs selected: ${(value - interactionState.reference.value).toFixed(3)}`;
    }

    tooltip.innerHTML = tooltipHtml;
    tooltip.style.opacity = 1;
    tooltip.style.left = `${e.clientX + 12}px`;
    tooltip.style.top = `${e.clientY + 12}px`;
  }

  function onHoverOut(div) {
    div.classList.remove("hovered");
    tooltip.style.opacity = 0;

    interactionState.hover = null;
    notify();
  }

  function onClick(div) {
    const song = div.dataset.song;
    const feature = div.dataset.featureKey;
    const value = +div.dataset[feature];
    const audioSrc = div.dataset.audio;

    // 同一个 div
    if (interactionState.playingDiv === div) {
      // 如果已经是 reference → 取消
      if (
        interactionState.reference &&
        interactionState.reference.song === song &&
        interactionState.reference.feature === feature
      ) {
        interactionState.reference = null;
        notify();

        if (currentAudio) {
          currentAudio.pause();
          div.classList.remove("playing");
        }
        return;
      }

      // 否则只是 play / pause
      if (currentAudio?.paused) {
        currentAudio.play();
        div.classList.add("playing");
      } else {
        currentAudio.pause();
        div.classList.remove("playing");
      }
      return;
    }

    // 切换 song
    if (currentAudio) {
      currentAudio.pause();
      interactionState.playingDiv?.classList.remove("playing");
    }

    if (audioSrc) {
      currentAudio = new Audio(audioSrc);
      currentAudio.play();
      div.classList.add("playing");
      interactionState.playingDiv = div;

      currentAudio.onended = () => {
        div.classList.remove("playing");
        currentAudio = null;
        interactionState.playingDiv = null;

        // ✅ 新增：audio 播放结束后清除 reference
        if (
          interactionState.reference &&
          interactionState.reference.song === song &&
          interactionState.reference.feature === feature
        ) {
          interactionState.reference = null;
          notify(); // 触发 updateFromState 清除 KDE reference area
        }
      };
    }

    // 👉 只在这里设置 reference state
    interactionState.reference = { song, feature, value };
    notify();
  }

  return { bind };
}
