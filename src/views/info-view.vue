<script setup>
import * as d3 from "../d3_wrap";
import { useChatStore } from "@/store/store";
import { inject, onMounted, useTemplateRef, watch } from "vue";

const chart = useTemplateRef("chart");
const store = useChatStore();
const selectedTheme = inject("selectedTheme");

let data;

function Id(id) {
  this.id = id;
  this.href = "#" + id;
}

Id.prototype.toString = function () {
  return "url(" + this.href + ")";
};

let count = 0;
const DOM = { uid: (name) => new Id("O-" + (name == null ? "" : name + "-") + ++count) };

function nestedTree() {
  chart.value.textContent = "";

  // Specify the chart’s dimensions.
  const width = 1400;
  const height = 900;
  const color = d3.scaleSequential(
    selectedTheme.value == "dark" ? [-1, 8] : [8, -1],
    d3.interpolateMagma,
  );
  // const color = d3.scaleSequential([8, -1], d3.interpolateMagma);

  // Create the treemap layout.
  const treemap = (data) =>
    d3.treemap().size([width, height]).paddingOuter(1).paddingTop(19).paddingInner(1).round(true)(
      d3
        .hierarchy(data)
        .sum((d) => d.value)
        .sort((a, b) => b.value - a.value),
    );
  const root = treemap(data);

  // Create the SVG container.
  const svg = d3
    .select(chart.value)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; overflow: visible; font: 15px calibri; ");

  const shadow = DOM.uid("shadow");

  svg
    .append("filter")
    .attr("id", shadow.id)
    .append("feDropShadow")
    .attr("flood-opacity", 0.3)
    .attr("dx", 0)
    .attr("stdDeviation", 3);

  const node = svg
    .selectAll("g")
    .data(d3.group(root, (d) => d.width))
    .join("g")
    .attr("filter", shadow)
    .selectAll("g")
    .data((d) => d[1])
    .join("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  const format = d3.format(",d");
  node.append("title").text(
    (d) =>
      `${d
        .ancestors()
        .reverse()
        .map((d) => d.data.name)
        .join("/")}\n${format(d.value)}`,
  );

  node
    .append("rect")
    .attr("id", (d) => (d.nodeUid = DOM.uid("node")).id)
    .attr("fill", (d) => color(d.height))
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0);

  node
    .append("clipPath")
    .attr("id", (d) => (d.clipUid = DOM.uid("clip")).id)
    .append("use")
    .attr("xlink:href", (d) => d.nodeUid.href);

  node
    .append("text")
    .attr("clip-path", (d) => d.clipUid)
    .selectAll("tspan")
    .data((d) =>
      String(d.data.name)
        // .split(/(?=[A-Z][^A-Z])/g)
        .split(/\s+/g)
        .concat(format(d.value)),
    )
    .join("tspan")
    .attr("fill-opacity", (d, i, nodes) => (i === nodes.length - 1 ? 0.7 : null))
    .text((d) => d);

  node
    .filter((d) => d.children)
    .selectAll("tspan")
    .attr("dx", 3)
    .attr("y", 13);

  node
    .filter((d) => !d.children)
    .selectAll("tspan")
    .attr("x", 3)
    .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`);
}

onMounted(() => {
  data = store.treeMap;
  nestedTree();
});

watch(selectedTheme, () => {
  nestedTree();
});
</script>

<template>
  <article class="">
    <h2>ЧатСтат</h2>
    <p>
      Версия сборки: <code> {{ store.appVersion ?? "dev" }}</code>
      <br />
      Размер архива: {{ store.packedSize?.toLocaleString() }}
      <br />
      Размер после распаковки:
      {{ store.storage?.abSize?.toLocaleString() }}
      <br />
      Размер файла со статистикой:
      {{ store.storage?.list?.["stats.bin"]?.s.toLocaleString() }}
      <br />
      Дата генерации статистики:
      {{ new Date(store.stats?.genTime * 1000).toLocaleString("ru-RU") }}
    </p>
    <h4>Состав файла статистики:</h4>
    <svg ref="chart"></svg>
  </article>
  <article>
    <h2>Используемые библиотеки:</h2>
    <ul>
      <li><a href="https://vuejs.org/" target="_blank">vue.js</a></li>
      <li><a href="https://pinia.vuejs.org/" target="_blank">pinia</a></li>
      <li><a href="https://picocss.com/" target="_blank">pico.css</a></li>
      <li>
        <a href="https://d3js.org/" target="_blank">d3.js</a> + код из примеров:
        <a href="https://observablehq.com/@d3/pie-chart/2" target="_blank">Pie</a>,
        <a href="https://observablehq.com/@d3/multi-line-chart/2" target="_blank">Line</a>,
        <a href="https://observablehq.com/@d3/calendar/2" target="_blank">Calendar</a>,
        <a href="https://observablehq.com/@d3/nested-treemap" target="_blank">TreeMap</a>
      </li>
      <li><a href="https://toggles.dev/" target="_blank">toggles.dev</a> – переключатель режима</li>
      <li><a href="https://fontawesome.com/" target="_blank">Font Awesome</a> – иконки</li>
    </ul>
  </article>
</template>
