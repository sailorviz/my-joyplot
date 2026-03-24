import * as d3 from "d3";

export function setWaveformStates(container, allInteractionLockedRef, clickLockedRef){
  const layers = d3.select(container)
    .select(".left-panel")
    .select(".joyplot-div")
    .select(".joyplot-svg")
    .selectAll(".joy-layer");

  return {
    pauseInteraction(){
      allInteractionLockedRef.current = true;
      layers.style("pointer-events", "none");
    },

    resetInteraction(){
      allInteractionLockedRef.current = false;
      layers.style("pointer-events", "all");
    },

    pauseClick(){
      clickLockedRef.current = true;
    },

    resetClick(){
      clickLockedRef.current = false;
    },

    show(){
      layers.style("opacity", 1);
    },

    hide(){
      layers.style("opacity", 0);
    },

    remove(){
      layers.remove();
    }
  };
}
