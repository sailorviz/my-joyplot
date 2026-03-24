import { resetKDEZoom } from "./resetKDEZoom";
import { zoomToKDE } from "./zoomToKDE";

export function backToFeature(container, featureKey, featureStates) {
  resetKDEZoom(container);
  zoomToKDE(container, featureKey);

  const state = featureStates[featureKey];
  if (!state) return;

  setTimeout(() => {
    state.forEach(s => {
      const div = container.querySelector(`.four-curves-songs[data-id="${s.id}"]`);
      if (div) {
        div.style.left = s.left;
        div.style.top = s.top;
        div.style.display = "block";
        div.dataset.featureKey = featureKey;
      }
    });
  }, 510);

}
