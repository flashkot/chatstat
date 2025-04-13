<script setup>
import { strCompare } from "@/utils/collator";
import { computed, ref } from "vue";
import SortIcon from "./sort-icon.vue";

const { colsCfg, rowId, initialSort, rows, footer, noSorting } = defineProps({
  colsCfg: Object,
  rowId: String,
  initialSort: Object,
  rows: Array,
  footer: Object,
  noSorting: Boolean,
});

const sortCol = ref(initialSort.col);
const sortOrder = ref(initialSort.order);

const sortedRows = computed(() => {
  return noSorting
    ? [...rows]
    : [...rows].sort((a, b) => {
        return (
          (sortOrder.value == "desc" ? -1 : 1) * strCompare(a[sortCol.value], b[sortCol.value])
        );
      });
});

const colors = [
  "1f77b4",
  "ff7f0e",
  "2ca02c",
  "d62728",
  "9467bd",
  "8c564b",
  "e377c2",
  "7f7f7f",
  "bcbd22",
  "17becf",
];

const colsMinMax = computed(() => {
  let res = {};

  for (let c in colsCfg) {
    if (colsCfg[c].type != Number) {
      continue;
    }

    let color = parseInt(colors[c % 10], 16);
    let col = colsCfg[c].id;
    res[col] = {
      max: -Infinity,
      min: Infinity,
      color: `${(color >> 16) & 255},${(color >> 8) & 255},${color & 255}`,
    };

    rows.forEach((r) => {
      res[col].max = Math.max(res[col].max, parseFloat(r[col]));
      res[col].min = Math.min(res[col].min, parseFloat(r[col]));
    });
  }

  return res;
});

function getCellBG(col, val) {
  if (!colsMinMax.value[col]) {
    return;
  }

  let t = (0.7 * (parseFloat(val) - colsMinMax.value[col].min)) / colsMinMax.value[col].max;

  return `rgba(${colsMinMax.value[col].color}, ${t})`;
}

function ohHeadClick(ev) {
  if (ev.target.dataset.field) {
    sortOrder.value = sortOrder.value == "desc" ? "asc" : "desc";

    if (ev.target.dataset.field != sortCol.value) {
      sortOrder.value = initialSort.order;
    }

    sortCol.value = ev.target.dataset.field;
  }
}

function formatVal(val) {
  return typeof val === "number" ? val.toLocaleString() : val;
}
</script>

<template>
  <table>
    <thead @click="ohHeadClick">
      <tr>
        <th v-for="col in colsCfg" :key="col.id" :data-field="col.id">
          {{ col.label }}
          <SortIcon :order="sortCol == col.id ? sortOrder : ''" />
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in sortedRows" :key="row[rowId]" :data-id="row[rowId]">
        <td
          v-for="col in colsCfg"
          :key="col.id"
          :data-col="col.id"
          :style="`background-color:${getCellBG(col.id, row[col.id])}`"
        >
          <span :style="{ color: col.id == 'name' ? row.color : '' }">{{
            formatVal(row[col.id])
          }}</span>
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <th v-for="(col, i) in footer" :key="i">{{ formatVal(col) }}</th>
      </tr>
    </tfoot>
  </table>
</template>

<style scoped>
tbody tr td:first-child {
  font-weight: bold;
}

table {
  table-layout: fixed;
}

table td,
table th {
  text-align: right;
  padding: 0;
}

table td:first-child,
table th:first-child {
  padding-left: 10px;
}

table td:last-child,
table th:last-child {
  padding-right: 10px;
}

table thead th {
  /* text-align: center; */
  white-space: nowrap;
  padding: 10px 0;
  line-height: 16px;
  vertical-align: text-top;
  user-select: none;
  cursor: pointer;
}

/*//REVIEW: idk how to do this programmatically for large amount of colums*/
table td:nth-child(1),
table th:nth-child(1) {
  text-align: left;
}

/* tbody tr td:first-child {
  background-color: #0000 !important;
}
@media (prefers-color-scheme: dark) {
  tbody tr:hover {
    background-color: #212121 !important;
  }
}

@media (prefers-color-scheme: light) {
  tbody tr:hover {
    background-color: #e9e9e9 !important;
  }
}

html[data-theme="light"] tbody tr:hover {
  background-color: #e9e9e9 !important;
}

html[data-theme="dark"] tbody tr:hover {
  background-color: #212121 !important;
} */
</style>
