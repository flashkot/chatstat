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

const store = useChatStore();

const chatStats = computed(() => store.getStats());
</script>

<template>
  <h1>Про что {{ store.stats.name }}?</h1>
  <article class="flex-container no-selection center-content">
    <WordsCloud :stats="chatStats.wordCloud" :name="`${store.stats.name} - all time`" />
  </article>
  <article>
    <StatsText :stats="chatStats" :days="chatStats.daysInStats" />
  </article>

  <div class="flex-container">
    <div class="flex-container">
      <article>
        <StatsTable :data="chatStats" />
      </article>
      <article class="flex-item center-content no-selection">
        <CalendarView :stats="chatStats.postPerDay" />
      </article>
    </div>
    <article class="flex-container">
      <div class="flex-item center-content no-selection">
        <PieChart :rows="Object.values(chatStats.users)" />
      </div>

      <div class="flex-item center-content no-selection flex-column">
        <LineChart :stats="chatStats" />
      </div>
    </article>
    <article class="flex-container">
      <TopLists :stats="chatStats" />
    </article>
  </div>
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
.no-selection {
  user-select: none;
}
</style>
