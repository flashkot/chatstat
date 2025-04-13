<script setup>
const selectedMonth = defineModel({ type: String });
const { monthList, placeholder } = defineProps({ monthList: Array, placeholder: String });
</script>

<template>
  <select name="month" required v-model="selectedMonth" style="width: auto">
    <option v-if="!selectedMonth && placeholder" value="" disabled selectd>
      {{ placeholder }}
    </option>
    <option
      v-for="month in monthList"
      :key="month.value"
      :value="month.value"
      :selected="selectedMonth == month.value"
      :style="{ 'font-weight': selectedMonth == month.value ? 'bold' : '' }"
    >
      {{ month.text }}
    </option>
  </select>
</template>
