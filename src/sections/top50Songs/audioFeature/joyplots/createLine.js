import * as d3 from "d3";
export function createLine(xScale, yScale){
  return d3.line()
    .x((d, i) => xScale(i))
    .y(d => yScale(d))
    .curve(d3.curveBasis);
}