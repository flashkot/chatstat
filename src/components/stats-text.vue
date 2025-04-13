<script setup>
import { computed } from "vue";

const { stats, days } = defineProps({ stats: Object, days: Number });

function numStr(num) {
  return Math.round(Number(num)).toLocaleString();
}

function getNoun(number, one, two, five) {
  let n = Math.round(Math.abs(number));

  n %= 100;

  if (n >= 5 && n <= 20) {
    return five;
  }

  n %= 10;

  if (n === 1) {
    return one;
  }

  if (n >= 2 && n <= 4) {
    return two;
  }

  return five;
}

const nums = computed(() => ({
  wordsInMsg: stats.words / stats.messages,
  msgsInDay: stats.messages / days,
  vidMins: stats.video_seconds / 60,
  audMins: stats.audio_seconds / 60,
  mPixel: stats.megapixels / 1_000_000,
  oterMB: stats.otherFileSize / 1_048_576,
  totalMB: stats.totalFileSize / 1_048_576,
}));
</script>

<template>
  <p>
    <strong>{{ numStr(stats.symbols) }}</strong>
    {{ getNoun(stats.symbols, "символ", "символа", "символов") }},
    <strong>{{ numStr(stats.words) }}</strong>
    {{ getNoun(stats.words, "слово", "слова", "слов") }} и
    <strong>{{ numStr(stats.messages) }}</strong>
    {{ getNoun(stats.words, "сообщение", "сообщения", "сообщений") }}. И всё это за {{ days }}
    {{ getNoun(days, "день", "дня", "дней") }}. Если посчитать, то получится примерно
    {{ numStr(nums.wordsInMsg) }} {{ getNoun(nums.wordsInMsg, "слово", "слова", "слов") }} в
    сообщении и {{ numStr(nums.msgsInDay) }}
    {{ getNoun(nums.msgsInDay, "сообщение", "сообщения", "сообщений") }} в день.
  </p>
  <p>
    А ещё мы посмотрели <strong>{{ numStr(nums.vidMins) }}</strong>
    {{ getNoun(nums.vidMins, "минуту", "минуты", "минут") }} видео ({{ numStr(stats.videos) }}
    {{ getNoun(stats.videos, "файл", "файла", "файлов") }}), послушали
    <strong>{{ numStr(nums.audMins) }}</strong>
    {{ getNoun(nums.audMins, "минуту", "минуты", "минут") }} аудио ({{ numStr(stats.audios) }}
    {{ getNoun(stats.audios, "файл", "файла", "файлов") }}) и насладились
    <strong>{{ numStr(nums.mPixel) }}</strong>
    {{ getNoun(nums.mPixel, "мегапикселем", "мегапикселями", "мегапикселями") }} фоток и мемов ({{
      numStr(stats.images)
    }}
    {{ getNoun(stats.images, "файл", "файла", "файлов") }}). Кроме этого было ещё
    {{ numStr(stats.otherFiles) }} прочих файликов на {{ numStr(nums.oterMB) }}
    {{ getNoun(stats.audios, "мегабайт", "мегабайта", "мегабайт") }}.
  </p>
  <p>
    Вся эта медиа-радость весит {{ numStr(nums.totalMB) }}
    {{ getNoun(nums.totalMB, "мегабайт", "мегабайта", "мегабайт") }}.
  </p>
</template>
