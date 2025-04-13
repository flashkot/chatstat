<script setup>
import * as d3 from "../d3_wrap";
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";

const { stats } = defineProps({
  stats: Object,
});

const perWeekDay = ref(false);

// hour to start chart x axis from
const CHART_SHIFT = 3;
const SHIFT_FROM_MSK = new Date().getTimezoneOffset() / -60 - 3;

const lineColors = {
  0: "rgb(191, 102, 64)",
  1: "rgb(191, 179, 64)",
  2: "rgb(64, 191, 77)",
  3: "rgb(64, 153, 191)",
  4: "rgb(64, 115, 191)",
  5: "rgb(191, 64, 179)",
  6: "rgb(128, 64, 191)",
  week: "rgb(64, 115, 191)",
};

const postsPerHour = computed(() => {
  let value = {};
  let data;

  if (!perWeekDay.value) {
    data = new Array(24).fill(0);
    value.week = data;
  }

  for (let d in stats.postPerWeekHour) {
    let days = stats.postPerWeekHour[d];

    if (perWeekDay.value) {
      data = new Array(24).fill(0);
      value[d] = data;
    }

    for (let h in days) {
      data[(Number(h) + 24 - CHART_SHIFT) % 24] += days[h];
    }
  }

  return value;
});

const chart = useTemplateRef("chart");

function doD3() {
  // source: https://observablehq.com/@d3/multi-line-chart/2

  // FIXME: this is bad. This must be done in d3 way so code can update graph
  // and not just redraw it each time
  chart.value.textContent = "";

  const formatDay = (i) => ["ПН: ", "ВТ: ", "СР: ", "ЧТ: ", "ПТ: ", "СБ: ", "ВС: "][i];

  const linePoints = [];
  for (let l in postsPerHour.value) {
    postsPerHour.value[l].forEach((v, h) => {
      linePoints.push({
        h,
        l,
        v,
      });
    });
  }

  // Specify the chart’s dimensions.
  const width = 800;
  const height = 400;
  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 30;
  const marginLeft = 30;

  // Create the positional scales.
  const x = d3
    .scaleLinear()
    .domain([0, 23])
    .range([marginLeft, width - marginRight]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(linePoints, (d) => d.v)])
    .nice()
    .range([height - marginBottom, marginTop]);

  // Create the SVG container.
  const svg = d3
    .select(chart.value)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; overflow: visible; font: 10px sans-serif;");

  // Add the horizontal axis.
  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(24)
        .tickSizeOuter(0)
        .tickFormat((d) => (d + CHART_SHIFT + SHIFT_FROM_MSK) % 24),
    )
    .call((g) => g.select(".domain").remove())
    .selectAll(".tick line")
    .clone()
    .attr("y2", -height + marginBottom + marginTop)
    .attr("stroke-opacity", 0.1);

  // Add the vertical axis.
  svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y))
    .call((g) => g.select(".domain").remove())
    .selectAll(".tick line")
    .clone()
    .attr("x2", width - marginLeft - marginRight)
    .attr("stroke-opacity", 0.1);

  // Compute the points in pixel space as [x, y, z], where z is the name of the series.
  const points = linePoints.map((d) => [x(d.h), y(d.v), d.l, d.v]);

  // Group the points by series.
  const groups = d3.rollup(
    points,
    (v) => Object.assign(v, { z: v[0][2] }),
    (d) => d[2],
  );

  // Draw the lines.
  const line = d3.line().curve(d3.curveCardinal.tension(0.5));
  const path = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .selectAll("path")
    .data(groups.values())
    .join("path")
    // .style("mix-blend-mode", "multiply")
    .attr("stroke", (d) => lineColors[d.z])
    .attr("d", line);

  // Add an invisible layer for the interactive tip.
  const dot = svg.append("g").attr("display", "none");

  dot.append("circle").attr("r", 2.5);

  dot.append("text").attr("text-anchor", "middle").attr("y", -8);

  svg
    .on("pointerenter", pointerentered)
    .on("pointermove", pointermoved)
    .on("pointerleave", pointerleft)
    .on("touchstart", (event) => event.preventDefault());

  //  return svg.node();

  // When the pointer moves, find the closest point, update the interactive tip, and highlight
  // the corresponding line. Note: we don't actually use Voronoi here, since an exhaustive search
  // is fast enough.
  function pointermoved(event) {
    const [xm, ym] = d3.pointer(event);
    const i = d3.leastIndex(points, ([x, y]) => Math.hypot(x - xm, y - ym));
    const [x, y, k, v] = points[i];
    path
      .style("opacity", ({ z }) => (z === k ? null : "0.2"))
      .filter(({ z }) => z === k)
      .raise();
    dot.attr("transform", `translate(${x},${y})`);
    dot.select("text").text(k == "week" ? v : formatDay(k) + v);
    svg.property("value", stats[i]).dispatch("input", { bubbles: true });
  }

  function pointerentered() {
    path.style("stroke", "0.2");
    dot.attr("display", null);
  }

  function pointerleft() {
    path.style("opacity", null);
    dot.attr("display", "none");
    svg.node().value = null;
    svg.dispatch("input", { bubbles: true });
  }
}

onMounted(() => doD3());
watch(postsPerHour, () => doD3());
</script>

<template>
  <svg ref="chart"></svg>
  <br />
  <label>
    <input name="perWeekDay" type="checkbox" role="switch" v-model="perWeekDay" />
    По дням недели
  </label>
</template>
