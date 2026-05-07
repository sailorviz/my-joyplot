import * as d3 from "d3";

export function updateLegend(svgLegendGroup, type, language = 'en') {
  if (!svgLegendGroup) return;

  const legendTexts = {
    zh: {
      oneSong: '一首歌',
      songNotInTop30Artists: '歌曲（非TOP30艺人）',
      songFromTop30Artists: '歌曲（TOP30艺人）',
      songNotInTop30Albums: '歌曲（非TOP30专辑）',
      songFromTop30Albums: '歌曲（TOP30专辑）',
      concentratedDistribution: '集中分布区域',
      densityArea: '密度区域',
      densityCurve: '密度曲线',
      densityAreaTop50: '密度区域（TOP50）',
      densityCurveTop50: '密度曲线（TOP50）',
      densityAreaAllSongs: '密度区域（全部歌曲）',
      densityCurveAllSongs: '密度曲线（全部歌曲）'
    },
    en: {
      oneSong: 'One Song',
      songNotInTop30Artists: 'Song NOT in Top30 Artists',
      songFromTop30Artists: 'Song from Top30 Artists',
      songNotInTop30Albums: 'Song NOT in Top30 Albums',
      songFromTop30Albums: 'Song from Top30 Albums',
      concentratedDistribution: 'Concentrated Distribution Area',
      densityArea: 'Density Area',
      densityCurve: 'Density Curve',
      densityAreaTop50: 'Density Area (Top50)',
      densityCurveTop50: 'Density Curve (Top50)',
      densityAreaAllSongs: 'Density Area (All Songs)',
      densityCurveAllSongs: 'Density Curve (All Songs)'
    }
  };

  const t = legendTexts[language] || legendTexts.en;

  svgLegendGroup.selectAll("*").remove();

  if (type === "songs") {
    svgLegendGroup.append("rect")
      .attr("width", 14).attr("height", 14)
      .attr("fill", "var(--color-primary-darker)").attr("opacity", 0.8);
    svgLegendGroup.append("text")
      .attr("x", 20).attr("y", 12)
      .text(t.oneSong).attr("font-size", 12).attr("fill", "var(--color-text-secondary)");
    svgLegendGroup.transition().duration(400).attr("opacity", 1);
  }

  if (type === "songsWithArtist") {
    svgLegendGroup.append("rect").attr("width", 14).attr("height", 14)
      .attr("fill", "var(--color-primary-darker)").attr("opacity", 0.8);
    svgLegendGroup.append("text").attr("x", 20).attr("y", 12)
      .text(t.songNotInTop30Artists).attr("font-size", 12).attr("fill", "var(--color-text-secondary)");

    svgLegendGroup.append("rect").attr("y", 24).attr("width", 14).attr("height", 14)
      .attr("fill", "var(--color-secondary-darker)").attr("opacity", 0.8);
    svgLegendGroup.append("text").attr("x", 20).attr("y", 36)
      .text(t.songFromTop30Artists).attr("font-size", 12).attr("fill", "var(--color-text-secondary)");

    svgLegendGroup.append("rect").attr("y", 48).attr("width", 22).attr("height", 12)
      .attr("fill", "var(--color-text-tertiary)").attr("opacity", 0.12);
    svgLegendGroup.append("text").attr("x", 30).attr("y", 58)
      .text(t.concentratedDistribution).attr("font-size", 12).attr("fill", "var(--color-text-secondary)");

    svgLegendGroup.transition().duration(400).attr("opacity", 1);
  }

  if (type === "songsWithAlbum") {
    svgLegendGroup.append("rect").attr("width", 14).attr("height", 14)
      .attr("fill", "var(--color-primary-darker)").attr("opacity", 0.8);
    svgLegendGroup.append("text").attr("x", 20).attr("y", 12)
      .text(t.songNotInTop30Albums).attr("font-size", 12).attr("fill", "var(--color-text-secondary)");

    svgLegendGroup.append("rect").attr("y", 24).attr("width", 14).attr("height", 14)
      .attr("fill", "var(--color-secondary-darker)").attr("opacity", 0.8);
    svgLegendGroup.append("text").attr("x", 20).attr("y", 36)
      .text(t.songFromTop30Albums).attr("font-size", 12).attr("fill", "var(--color-text-secondary)");

    svgLegendGroup.append("rect").attr("y", 48).attr("width", 22).attr("height", 12)
      .attr("fill", "var(--color-text-tertiary)").attr("opacity", 0.12);
    svgLegendGroup.append("text").attr("x", 30).attr("y", 58)
      .text(t.concentratedDistribution).attr("font-size", 12).attr("fill", "var(--color-text-secondary)");

    svgLegendGroup.transition().duration(400).attr("opacity", 1);
  }

  if (type === "kde") {
    svgLegendGroup.append("rect").attr("width", 22).attr("height", 12)
      .attr("fill", "var(--color-primary-darker)").attr("opacity", 0.3);
    svgLegendGroup.append("text").attr("x", 30).attr("y", 10)
      .text(t.densityArea).attr("font-size", 12).attr("fill", "var(--color-text-secondary)");

    svgLegendGroup.append("line")
      .attr("x1", 0).attr("y1", 30).attr("x2", 22).attr("y2", 30)
      .attr("stroke", "var(--color-primary-darker)").attr("stroke-width", 2);
    svgLegendGroup.append("text").attr("x", 30).attr("y", 34)
      .text(t.densityCurve).attr("font-size", 12).attr("fill", "var(--color-text-secondary)");

    svgLegendGroup.transition().duration(400).attr("opacity", 1);
  }

  if (type === "kdeOfTwo") {
    svgLegendGroup.append("rect").attr("width", 22).attr("height", 12)
      .attr("fill", "var(--color-primary-darker)").attr("opacity", 0.3);
    svgLegendGroup.append("text").attr("x", 30).attr("y", 10)
      .text(t.densityAreaTop50).attr("font-size", 12).attr("fill", "var(--color-text-secondary)");

    svgLegendGroup.append("line")
      .attr("x1", 0).attr("y1", 30).attr("x2", 22).attr("y2", 30)
      .attr("stroke", "var(--color-primary-darker)").attr("stroke-width", 2);
    svgLegendGroup.append("text").attr("x", 30).attr("y", 34)
      .text(t.densityCurveTop50).attr("font-size", 12).attr("fill", "var(--color-text-secondary)");

    svgLegendGroup.append("rect").attr("x", 0).attr("y", 50)
      .attr("width", 22).attr("height", 12)
      .attr("fill", "var(--color-secondary-darker)").attr("opacity", 0.3);
    svgLegendGroup.append("text").attr("x", 30).attr("y", 60)
      .text(t.densityAreaAllSongs).attr("font-size", 12).attr("fill", "var(--color-text-secondary)");

    svgLegendGroup.append("line")
      .attr("x1", 0).attr("y1", 80).attr("x2", 22).attr("y2", 80)
      .attr("stroke", "var(--color-secondary-darker)").attr("stroke-width", 2);
    svgLegendGroup.append("text").attr("x", 30).attr("y", 84)
      .text(t.densityCurveAllSongs).attr("font-size", 12).attr("fill", "var(--color-text-secondary)");

    svgLegendGroup.transition().duration(400).attr("opacity", 1);
  }

  if (type === "hide") {
    svgLegendGroup.transition().duration(300).attr("opacity", 0);
  }
}
