<script setup>
import { computed, inject } from "vue";

import { useChatStore } from "@/store/store";
import CalendarView from "@/charts/calendar-view.vue";
import LineChart from "@/charts/line-chart.vue";
import WordsCloud from "@/charts/words-cloud.vue";
import MonthSelector from "@/components/monthSelector.vue";
import TableView from "@/components/tableView.vue";
import TopLists from "@/components/top-lists.vue";
import StatsText from "@/components/stats-text.vue";

const { showUser } = defineProps({ showUser: String });

const store = useChatStore();
const selectedUser = computed(() => String(showUser || store.usersList[0].value));

const monthStats = computed(() => store.getStats(null, selectedUser.value));

const statsTable = computed(() => {
  let s = monthStats.value;
  return [
    { a: "Сообщений", b: numStr(s.messages), c: "", d: "" },
    {
      a: "С текстом",
      b: numStr(s.texts),
      c: ((100 * s.texts) / s.messages).toFixed(2) + "%",
      d: "",
    },
    { a: "Символов", b: numStr(s.symbols), c: "", d: "" },
    { a: "Слов", b: numStr(s.words), c: "", d: "" },
    {
      a: "Стикеров",
      b: numStr(s.stickers),
      c: ((100 * s.stickers) / s.messages).toFixed(2) + "%",
      d: "",
    },
    {
      a: "Отредактировано",
      b: numStr(s.edits),
      c: ((100 * s.edits) / s.messages).toFixed(2) + "%",
      d: "",
    },
    {
      a: "Ответов отправлено",
      b: numStr(s.replies),
      c: ((100 * s.replies) / s.messages).toFixed(2) + "%",
      d: "",
    },
    {
      a: "Ответов получено",
      b: numStr(s.receivedReplies),
      c: "",
      d: "",
    },
    {
      a: "Репостов",
      b: numStr(s.forwards),
      c: ((100 * s.forwards) / s.messages).toFixed(2) + "%",
      d: "",
    },
    {
      a: "Сообщений с медиа",
      b: numStr(s.media),
      c: ((100 * s.media) / s.messages).toFixed(2) + "%",
      d: "",
    },
    {
      a: "Картинок",
      b: numStr(s.images),
      c: numStr(s.photoFileSize) + " байт",
      d: numStr(s.megapixels) + " пикселей",
    },
    {
      a: "Видео",
      b: numStr(s.videos),
      c: numStr(s.videoFilesize) + " байт",
      d: numStr(s.video_seconds) + " секунд",
    },
    {
      a: "Аудио",
      b: numStr(s.audios),
      c: numStr(s.audioFileSize) + " байт",
      d: numStr(s.audio_seconds) + " секунд",
    },
    {
      a: "Прочие файлы",
      b: numStr(s.otherFiles),
      c: numStr(s.otherFileSize) + " байт",
      d: "",
    },
    {
      a: "Всего файлов",
      b: numStr(s.files),
      c: numStr(s.totalFileSize) + " байт",
      d: "",
    },
    { a: "Получено реакций", b: numStr(s.reactionsCount), c: "", d: "" },
    { a: "Хэштегов", b: numStr(s.hashTagsCount), c: "", d: "" },
    { a: "Упоминаний", b: numStr(s.mentionsCount), c: "", d: "" },
    { a: "Ссылок", b: numStr(s.sitesCount), c: "", d: "" },
  ];
});

const colsCfg = [
  {
    id: "a",
    label: "Параметр",
    type: String,
  },
  {
    id: "b",
    label: "",
    type: String,
  },
  {
    id: "c",
    label: "",
    type: String,
  },
  {
    id: "d",
    label: "",
    type: String,
  },
];

function numStr(num) {
  return Math.round(Number(num)).toLocaleString();
}

const navigateTo = inject("navigateTo");

function switchUser(ev) {
  navigateTo("users", ev);
}
</script>

<template>
  <h1>
    <MonthSelector
      :modelValue="selectedUser"
      @update:modelValue="switchUser"
      :month-list="store.usersList"
      v-if="store.isLoaded"
    />
    это:
  </h1>

  <article class="flex-container no-selection center-content">
    <WordsCloud :stats="monthStats.wordCloud" :name="`${store.stats.chatName} - ${selectedUser}`" />
  </article>

  <article>
    <StatsText :stats="monthStats" :days="monthStats.daysInStats" />
  </article>

  <div class="flex-container">
    <div class="flex-container">
      <article class="flex-item center-content no-selection">
        <CalendarView :stats="monthStats.postPerDay" />
      </article>
      <article class="flex-item center-content no-selection flex-column">
        <LineChart :stats="monthStats" />
      </article>
    </div>
  </div>

  <article class="flex-container">
    <TopLists :stats="monthStats" />
  </article>

  <article class="flex-container no-selection center-content">
    <TableView
      :cols-cfg="colsCfg"
      row-id="id"
      :initial-sort="{}"
      :rows="statsTable"
      :footer="[]"
      :no-sortng="true"
    />
  </article>
</template>

<style scoped>
#month-table {
  font-size: 15px;
  line-height: 10px;
}

.center-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.flex-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
}

.flex-item {
  flex-grow: 1;
}

.flex-column {
  flex-direction: column;
}
.no-selection {
  user-select: none;
}
</style>
