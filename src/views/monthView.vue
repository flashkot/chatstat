<script setup>
import { computed } from "vue";

import { useChatStore } from "@/store/store";
import PieChart from "@/charts/pie-chart.vue";
import CalendarView from "@/charts/calendar-view.vue";
import LineChart from "@/charts/line-chart.vue";
import WordsCloud from "@/charts/words-cloud.vue";
import StatsTable from "@/components/stats-table.vue";
import TopLists from "@/components/top-lists.vue";
import StatsText from "@/components/stats-text.vue";

const { selectedMonth } = defineProps({ selectedMonth: String });
const store = useChatStore();
const monthStats = computed(() => store.getStats(selectedMonth));

const monthTitile = computed(() => {
  const months = [
    "январь",
    "февраль",
    "март",
    "апрель",
    "май",
    "июнь",
    "июль",
    "август",
    "сентябрь",
    "октябрь",
    "ноябрь",
    "декабрь",
  ];
  let nums = selectedMonth.split("-");

  return `${months[Number(nums[1]) - 1]} ${nums[0]}-го`;
});
</script>

<template>
  <h1>Про что же был {{ monthTitile }}?</h1>
  <article class="flex-container no-selection center-content">
    <WordsCloud
      :stats="monthStats.wordCloud"
      :name="`${store.stats.chatName} - ${selectedMonth}`"
    />
  </article>
  <article class="flex-container flex-no-wrap flex-align-center">
    <div class="flex-item">
      <StatsText :stats="monthStats" :days="monthStats.daysInStats" />
    </div>
    <div class="flex-item center-content no-selection flex-no-shrink">
      <CalendarView :stats="monthStats.postPerDay" :forMonth="selectedMonth" />
    </div>
  </article>
  <div class="flex-container">
    <article class="flex-container overflow-auto">
      <StatsTable :data="monthStats" :name="`${store.stats.chatName} - ${selectedMonth}`" />
    </article>
    <article class="flex-container">
      <div class="flex-item center-content no-selection">
        <PieChart :rows="Object.values(monthStats.users)" />
      </div>
      <div class="flex-item center-content no-selection flex-column">
        <LineChart :stats="monthStats" />
      </div>
    </article>
  </div>
  <article>
    <TopLists :stats="monthStats" />
  </article>
</template>

<style scoped>
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

.flex-no-wrap {
  @media (min-width: 1024px) {
    flex-wrap: nowrap;
  }
}

.flex-no-shrink {
  flex-shrink: 0;
}

.flex-align-center {
  align-items: center;
}

.no-selection {
  user-select: none;
}
</style>
