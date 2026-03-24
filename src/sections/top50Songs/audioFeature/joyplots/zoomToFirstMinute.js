import * as d3 from "d3";
import { timeToIndex } from "./timeToIndex";

export function zoomToFirstMinute() {
  const firstMinute = 60;
  const endIndex = timeToIndex(firstMinute);

  const width = window.innerWidth;

  const newXScale = d3.scaleLinear()
    .domain([0, endIndex])
    .range([0, width]);

  return {
    newXScale,
    newDomain: [0, endIndex],
  };
}


