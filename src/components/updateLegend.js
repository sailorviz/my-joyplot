import * as d3 from "d3";

export function updateLegend(svgLegendGroup, type) {
  if (!svgLegendGroup) return;

  // 先清空, selectAll()是d3的用法，必须用在d3 selection上而非dom
  svgLegendGroup.selectAll("*").remove();

  // 不同类型绘制不同 legend
  if (type === "songs") {   
    svgLegendGroup.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", "orange")
      .attr("opacity", 0.8);

    svgLegendGroup.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text("One Song")
      .attr("font-size", 14)
      .attr("fill", "#333");

    svgLegendGroup.transition().duration(400).attr("opacity", 1);
  }

    // --- NEW TYPE: songsWithArtist ---
  if (type === "songsWithArtist") {

    // 1. Song from top 30 artists (orange)
    svgLegendGroup.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", "orange")
      .attr("opacity", 0.8);

    svgLegendGroup.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text("Song NOT in Top30 Artists")
      .attr("font-size", 14)
      .attr("fill", "#333");

    // 2. Song NOT belonging to top 30 artists (green)
    svgLegendGroup.append("rect")
      .attr("y", 24)
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", "green")
      .attr("opacity", 0.8);

    svgLegendGroup.append("text")
      .attr("x", 20)
      .attr("y", 36)
      .text("Song from Top30 Artists")
      .attr("font-size", 14)
      .attr("fill", "#333");

    // 3. Distribution Area (blue area)
    svgLegendGroup.append("rect")
      .attr("y", 48)
      .attr("width", 22)
      .attr("height", 12)
      .attr("fill", "steelblue")
      .attr("opacity", 0.3);

    svgLegendGroup.append("text")
      .attr("x", 30)
      .attr("y", 58)
      .text("Concentrated Distribution Area")
      .attr("font-size", 14)
      .attr("fill", "#333");

    svgLegendGroup.transition().duration(400).attr("opacity", 1);
  }

  if (type === "songsWithAlbum") {

    // 1. Song from top 30 artists (orange)
    svgLegendGroup.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", "orange")
      .attr("opacity", 0.8);

    svgLegendGroup.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text("Song NOT in Top30 Albums")
      .attr("font-size", 14)
      .attr("fill", "#333");

    // 2. Song NOT belonging to top 30 artists (green)
    svgLegendGroup.append("rect")
      .attr("y", 24)
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", "green")
      .attr("opacity", 0.8);

    svgLegendGroup.append("text")
      .attr("x", 20)
      .attr("y", 36)
      .text("Song from Top30 Albums")
      .attr("font-size", 14)
      .attr("fill", "#333");

    // 3. Distribution Area (blue area)
    svgLegendGroup.append("rect")
      .attr("y", 48)
      .attr("width", 22)
      .attr("height", 12)
      .attr("fill", "steelblue")
      .attr("opacity", 0.3);

    svgLegendGroup.append("text")
      .attr("x", 30)
      .attr("y", 58)
      .text("Concentrated Distribution Area")
      .attr("font-size", 14)
      .attr("fill", "#333");

    svgLegendGroup.transition().duration(400).attr("opacity", 1);
  }

  if (type === "kde") {

      // --- KDE Area ---
      svgLegendGroup.append("rect")
        .attr("width", 22)
        .attr("height", 12)
        .attr("fill", "steelblue")
        .attr("opacity", 0.3);

      svgLegendGroup.append("text")
        .attr("x", 30)
        .attr("y", 10)
        .text("Density Area")
        .attr("font-size", 14)
        .attr("fill", "#333");

      // --- KDE Curve ---
      svgLegendGroup.append("line")
        .attr("x1", 0)
        .attr("y1", 30)
        .attr("x2", 22)
        .attr("y2", 30)
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);

      svgLegendGroup.append("text")
        .attr("x", 30)
        .attr("y", 34)
        .text("Density Curve")
        .attr("font-size", 14)
        .attr("fill", "#333");

      svgLegendGroup.transition().duration(400).attr("opacity", 1);
  }

  if (type === "kdeOfTwo") {

    // --- KDE Area (Top50) ---
    svgLegendGroup.append("rect")
      .attr("width", 22)
      .attr("height", 12)
      .attr("fill", "steelblue")
      .attr("opacity", 0.3);

    svgLegendGroup.append("text")
      .attr("x", 30)
      .attr("y", 10)
      .text("Density Area (Top50)")
      .attr("font-size", 14)
      .attr("fill", "#333");

    // --- KDE Curve (Top50) ---
    svgLegendGroup.append("line")
      .attr("x1", 0)
      .attr("y1", 30)
      .attr("x2", 22)
      .attr("y2", 30)
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2);

    svgLegendGroup.append("text")
      .attr("x", 30)
      .attr("y", 34)
      .text("Density Curve (Top50)")
      .attr("font-size", 14)
      .attr("fill", "#333");

    // --- KDE Area (All Songs) ---
    svgLegendGroup.append("rect")
      .attr("x", 0)
      .attr("y", 50)  // 下移 40px
      .attr("width", 22)
      .attr("height", 12)
      .attr("fill", "orange")
      .attr("opacity", 0.3);

    svgLegendGroup.append("text")
      .attr("x", 30)
      .attr("y", 60)
      .text("Density Area (All Songs)")
      .attr("font-size", 14)
      .attr("fill", "#333");

    // --- KDE Curve (All Songs) ---
    svgLegendGroup.append("line")
      .attr("x1", 0)
      .attr("y1", 80)  // 下移 50px
      .attr("x2", 22)
      .attr("y2", 80)
      .attr("stroke", "orange")
      .attr("stroke-width", 2);

    svgLegendGroup.append("text")
      .attr("x", 30)
      .attr("y", 84)
      .text("Density Curve (All Songs)")
      .attr("font-size", 14)
      .attr("fill", "#333");

      svgLegendGroup.transition().duration(400).attr("opacity", 1);
  }

  if (type === "hide") {
    svgLegendGroup.transition().duration(300).attr("opacity", 0);
  }
}
