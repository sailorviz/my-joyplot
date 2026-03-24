import { projectSongsToFeature } from "./projectSongsToFeature";

export function projectSongsToFeatureWithState(container, featureScales, featureKey, featureStates) {
  projectSongsToFeature(container, featureScales, featureKey);

  const songDivs = container.querySelectorAll(".four-curves-songs");
  featureStates[featureKey] = Array.from(songDivs).map(div => ({
    id: div.dataset.id,
    left: div.style.left,
    top: div.style.top,
    featureKey: div.dataset.featureKey // 👈 其实就是 featureKey
  }));
}