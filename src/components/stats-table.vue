<script setup>
import { computed, inject, ref } from "vue";
import TableView from "@/components/tableView.vue";
import { saveFile } from "@/utils/savefile";

const { data, name } = defineProps({ data: Object, name: String });

const showPercents = ref(false);

const monthData = computed(() => Object.values(data.users));

const colsCfg = [
  {
    id: "name",
    label: "Имя",
    type: String,
  },
  // {
  //   id: "daysActive",
  //   label: "Дней",
  //   type: Number,
  //   percentFrom: "total",
  // },
  {
    id: "messages",
    label: "Сообщений",
    type: Number,
    percentFrom: "total",
  },
  // {
  //   id: "words",
  //   label: "Слов",
  //   type: Number,
  //   percentFrom: "total",
  // },
  {
    id: "bustle",
    label: "Суета",
    type: Number,
    percentFrom: "total",
  },
  {
    id: "reactionsCount",
    label: "Реакции",
    type: Number,
    percentFrom: "ofMessages",
  },
  // {
  //   id: "mentionsCount",
  //   label: "Упоминания",
  //   type: Number,
  //   percentFrom: "total",
  // },
  {
    id: "media",
    label: "Медиа",
    type: Number,
  },
  // {
  //   id: "files",
  //   label: "Файлы",
  //   type: Number,
  //   percentFrom: "total",
  // },
  {
    id: "forwards",
    label: "Форварды",
    type: Number,
  },
  {
    id: "replies",
    label: "Реплаи",
    type: Number,
  },
];

const initialSort = {
  col: "bustle",
  order: "desc",
};

const monthTotals = computed(() => {
  let row = {};

  for (let col in colsCfg) {
    row[colsCfg[col].id] = 0;
  }

  row.name = "Итого:";

  monthData.value.forEach((m) => {
    for (let col in colsCfg) {
      if (colsCfg[col].type == Number) {
        row[colsCfg[col].id] += m[colsCfg[col].id];
      }
    }
  });

  return row;
});

const monthTotalsValues = computed(() => {
  let row = [];

  for (let col in colsCfg) {
    row.push(monthTotals.value[colsCfg[col].id]);
  }

  return row;
});

const monthRows = computed(() => {
  if (showPercents.value) {
    return monthData.value.map((r) => {
      let row = { color: r.color, id: r.id };

      for (let col in colsCfg) {
        let cId = colsCfg[col].id;
        if (colsCfg[col].type == String) {
          row[cId] = r[cId];
        } else {
          if (colsCfg[col].percentFrom == "total") {
            row[cId] = ((100 * r[cId]) / monthTotals.value[cId]).toFixed(2) + "%";
          } else {
            if (r.messages) {
              row[cId] = ((100 * r[cId]) / r.messages).toFixed(2) + "%";
            } else {
              row[cId] = 0;
            }
          }
        }
      }

      return row;
    });
  }

  return monthData.value;
});

function downloadCSV() {
  // orders of columns is not always fixed.
  // and i want first ones to be id,name,daysActive,messages,bustle.
  // so here we make sure it is like this
  let cols = ["id", "name", "daysActive", "messages", "bustle"];
  Object.entries(monthData.value[0]).forEach(([col, val]) => {
    if (typeof val !== "string" && typeof val !== "number") {
      return false;
    }

    if (["color"].includes(col)) {
      return false;
    }

    if (!cols.includes(col)) {
      cols.push(col);
    }
  });

  let csvFile = cols.join(",") + "\n";

  monthData.value.forEach((r) => {
    csvFile += cols.map((c) => r[c]).join(",") + "\n";
  });

  saveFile(new Blob([csvFile], { type: "text/csv" }), (name ?? "data") + ".table.csv");
}

const navigateTo = inject("navigateTo");

function onclick(event) {
  let target = event.target;

  if (target.nodeName != "SPAN") {
    return;
  }

  while (target) {
    if (target.nodeName == "TD") {
      if (target.dataset.col == "name") {
        navigateTo("users", target.parentElement.dataset.id);
      }
    }
    target = target.parentElement;
  }
}
</script>

<template>
  <div id="month-table" class="flex-item">
    <TableView
      :cols-cfg="colsCfg"
      row-id="id"
      :initial-sort="initialSort"
      :rows="monthRows"
      :footer="monthTotalsValues"
      @click="onclick"
    />
    <div class="flex-container">
      <label>
        <input name="inPercent" type="checkbox" role="switch" v-model="showPercents" />
        Давай в процентах!
      </label>
      <p style="text-align: right; padding: 0; margin: 0; margin-block: 0; font-size: 10px">
        <a href="#" @click.prevent="downloadCSV">скачать CSV</a>
      </p>
    </div>
  </div>
</template>

<style scoped>
#month-table {
  font-size: 15px;
}

.flex-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  justify-content: space-between;
}

.flex-item {
  flex-grow: 1;
}

:deep(table) tbody tr td:first-child span {
  cursor: pointer;
}
</style>
