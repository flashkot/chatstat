<script setup>
import * as d3 from "../d3_wrap";
import { inject, onMounted, useTemplateRef, watch } from "vue";

const selectedTheme = inject("selectedTheme");
const navigateTo = inject("navigateTo");

const { stats, forMonth } = defineProps({
  stats: Object,
  forMonth: String,
});

const chart = useTemplateRef("chart");

function doD3() {
  // source: https://observablehq.com/@d3/calendar/2

  chart.value.textContent = "";

  const cellSize = forMonth ? 32 : 16; // height of a day
  const height = cellSize * 9; // height of a week (5 days + padding)
  const width = 65 + cellSize * (forMonth ? 6 : 53); // width of the chart

  // Define formatting functions for the axes and tooltips.
  // const formatDate = (d) => d.date_str; //toLocaleDateString(d); //d3.timeFormat("%x");
  const formatDay = (i) => ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"][i - 1];
  const formatMonth = (i) =>
    [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ][i.getMonth()];

  // Helpers to compute a day’s position in the week.
  const timeWeek = d3.timeMonday;
  const chartStartDate = forMonth ? d3.timeMonth : d3.timeYear;
  const countDay = (i) => (i + 6) % 7;
  const fontSize = forMonth ? 15 : 12;
  const wDaysOffset = forMonth ? 8 : 4;

  // Compute the values used to color the cells: percent change is the difference between the day’s
  // closing value and the previous day’s, as a fraction of the latter.
  const data = [];
  let max = -Infinity;
  let min = Infinity;

  const monthStats = stats;

  for (let y in monthStats) {
    for (let m in monthStats[y]) {
      for (let d in monthStats[y][m]) {
        let val = monthStats[y][m][d];
        max = Math.max(max, val);
        min = Math.min(min, val);

        data.push({
          date: new Date(`${y}-${Number(m) + 1}-${d}`),
          date_str: `${y}.${String(Number(m) + 1).padStart(2, 0)}.${String(d).padStart(2, 0)}`,
          value: val,
        });
      }
    }
  }

  // Compute the extent of the value, ignore the outliers
  // and define a diverging and symmetric color scale.
  const color = d3
    .scaleSequential(selectedTheme.value == "light" ? d3.interpolateOrRd : d3.interpolatePlasma)
    .domain([-20, max]);

  // Group data by year, in reverse input order. (Since the dataset is chronological,
  // this will show years in reverse chronological order.)
  const years = d3.groups(data, (d) => d.date.getFullYear()).reverse();

  // A function that draws a thin white line to the left of each month.
  function pathMonth(t) {
    const d = countDay(t.getDay());
    const w = timeWeek.count(chartStartDate(t), t);
    return `${
      d === 0 ? `M${w * cellSize},0` : `M${(w + 1) * cellSize},0V${d * cellSize}H${w * cellSize}`
    }V${7 * cellSize}`;
  }

  const svg = d3
    .select(chart.value)
    .attr("width", width)
    .attr("height", height * years.length)
    .attr("viewBox", [0, 0, width, height * years.length])
    .attr("style", `max-width: 100%; height: auto; font-size: ${fontSize}px;`);

  const year = svg
    .selectAll("g")
    .data(years)
    .join("g")
    .attr("transform", (d, i) => `translate(55,${height * i + cellSize + 10})`);

  year
    .append("g")
    .attr("text-anchor", "end")
    .selectAll()
    .data(([key]) => [key])
    .join("text")
    .attr("x", -15)
    .attr("y", -5)
    .attr("font-weight", "bold")
    .attr("text-anchor", "end")
    .text((t) => t);

  year
    .append("g")
    .attr("text-anchor", "end")
    .selectAll()
    .data(d3.range(0, 8))
    .join("text")
    .attr("x", "-1em")
    .attr("y", (i) => (countDay(i) + 1) * cellSize - wDaysOffset)
    .text(formatDay);

  year
    .append("g")
    .selectAll()
    .data(([, values]) => values)
    .join("rect")
    .attr("width", cellSize - 1)
    .attr("height", cellSize - 1)
    .attr("x", (d) => timeWeek.count(chartStartDate(d.date), d.date) * cellSize + 1)
    .attr("y", (d) => countDay(d.date.getDay()) * cellSize + 1)
    .attr("data-date", (d) => d.date_str)
    .attr("class", "click")
    .attr("fill", (d) => color(d.value))
    .append("title")
    .text((d) => `${d.date_str}\n${d.value}`);

  const month = year
    .append("g")
    .selectAll()
    .data(([, values]) => d3.timeMonths(d3.timeMonth(values[0].date), values.at(-1).date))
    .join("g");

  month
    .filter((d, i) => i)
    .append("path")
    .attr("fill", "none")
    .attr("class", "month-stroke")
    .attr("d", pathMonth);

  month
    .append("text")
    .attr("x", (d) => timeWeek.count(chartStartDate(d), timeWeek.ceil(d)) * cellSize + 2)
    .attr("y", -5)
    .text(formatMonth);

  if (!forMonth) {
    let s = document.createElement("style");
    s.textContent =
      ".click {cursor: pointer;} path.month-stroke{stroke:var(--card-background-color);stroke-width:3px}";
    chart.value.appendChild(s);
  }
}

onMounted(() => doD3());

watch(
  () => stats,
  () => doD3(),
);

watch(selectedTheme, () => doD3());

function onclick(event) {
  if (!forMonth) {
    if (event.target.dataset.date) {
      let [y, m] = event.target.dataset.date.split(".");
      m = String(Number(m)).padStart(2, 0);
      navigateTo("month", y + "-" + m);
    }
  }
}
</script>

<template>
  <svg ref="chart" @click="onclick"></svg>
</template>
