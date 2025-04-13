<script setup>
import * as d3 from "../d3_wrap";
import { onMounted, useTemplateRef, watch } from "vue";

const { rows } = defineProps({
  rows: Array,
});

const chart = useTemplateRef("chart");

// Specify the chart’s dimensions.
const width = 350;
const height = Math.min(width, 350);

function doD3() {
  // source: https://observablehq.com/@d3/pie-chart/2
  // Create the pie layout and arc generator.

  chart.value.textContent = "";

  const pie = d3
    .pie()
    .sort((a, b) => b.messages - a.messages)
    .value((d) => d.messages);

  const arc = d3
    .arc()
    .innerRadius(0)
    .outerRadius(Math.min(width, height) / 2 - 1);

  const labelRadius = arc.outerRadius()() * 0.8;

  // A separate arc generator for labels.
  const arcLabel = d3.arc().innerRadius(labelRadius).outerRadius(labelRadius);

  const arcs = pie(rows);

  const sum = rows.reduce((s, v) => s + v.messages, 0);

  // Create the SVG container.
  const svg = d3
    .select(chart.value)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto; font-size: 15px;");

  // Add a sector path for each value.
  svg
    .append("g")
    .attr("stroke", "white")
    .selectAll()
    .data(arcs)
    .join("path")
    .attr("fill", (d) => d.data.color)
    .attr("d", arc)
    .append("title")
    .text((d) => `${d.data.name}: ${d.data.messages.toLocaleString()}`);

  // Create a new arc generator to place a label close to the edge.
  // The label shows the value if there is enough room.
  svg
    .append("g")
    .attr("text-anchor", "middle")
    .selectAll()
    .data(arcs)
    .join("text")
    .attr("transform", (d) => `translate(${arcLabel.centroid(d)})`)
    .call((text) =>
      text
        .filter((d) => d.endAngle - d.startAngle > 0.25)
        .append("tspan")
        .attr("y", "-0.2em")
        .attr("font-weight", "bold")
        .attr("color", "white")
        .text((d) => d.data.name),
    )
    .call((text) =>
      text
        .filter((d) => d.endAngle - d.startAngle > 0.25)
        .append("tspan")
        .attr("x", 0)
        .attr("y", "0.9em")
        .attr("fill-opacity", 0.7)
        .attr("color", "white")
        .text((d) => ((d.data.messages / sum) * 100).toFixed(1).toLocaleString() + "%"),
    );
}

onMounted(() => doD3());
watch(
  () => rows,
  () => doD3(),
);
</script>

<template>
  <svg ref="chart"></svg>
</template>

<style scoped></style>
