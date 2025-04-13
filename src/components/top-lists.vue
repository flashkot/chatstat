<script setup>
import { computed } from "vue";

const { stats } = defineProps({ stats: Object });

function prepareTopList(list, limit = 10) {
  return Object.entries(list)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map((i) => ({ name: i[0], count: i[1] }));
}

const topLists = computed(() => {
  let lists = {
    reactions: "Реакции",
    mentions: "Упоминания",
    hashTags: "Хэштеги",
    forwardsFrom: "Репосты",
    sites: "Сайты",
  };

  let result = [];

  for (let l in lists) {
    if (stats[l] && Object.keys(stats[l]).length) {
      result.push({ name: lists[l], items: prepareTopList(stats[l]) });
    }
  }

  return result;
});
</script>

<template>
  <!-- h4>Всякое популярное</h4-->
  <div class="flex-container">
    <div class="flex-item list-column" v-for="list in topLists" :key="list.name">
      <strong>{{ list.name }}:</strong>
      <ol>
        <li v-for="item in list.items" :key="item.name">{{ item.name }} ({{ item.count }})</li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.flex-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
}

.flex-item {
  flex-grow: 1;
}

.list-column {
  flex-basis: 20%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  justify-content: flex-start;
}

.list-column h5 {
  text-align: left;
}
</style>
