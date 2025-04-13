<script setup>
import { saveFile } from "@/utils/savefile";
import {
  CLOUD_HEIGHT,
  CLOUD_ROTATION_MULTIPLY,
  CLOUD_ROTATION_SHIFT,
  CLOUD_WIDTH,
} from "../parser/conf";
import { computed, ref, useTemplateRef, watch } from "vue";

const { stats, name } = defineProps({ stats: Object, name: String });
const svgNode = useTemplateRef("svg");
const sound = useTemplateRef("pop");
const poppedEmojis = ref([]);

const colors = [
  "#393b79",
  "#5254a3",
  "#6b6ecf",
  "#9c9ede",
  "#637939",
  "#8ca252",
  "#b5cf6b",
  "#cedb9c",
  "#8c6d31",
  "#bd9e39",
  "#e7ba52",
  "#e7cb94",
  "#843c39",
  "#ad494a",
  "#d6616b",
  "#e7969c",
  "#7b4173",
  "#a55194",
  "#ce6dbd",
  "#de9ed6",
];

function getColor(i) {
  return colors[i % colors.length];
}

const emojiRe = /^\p{Emoji_Presentation}$/u;

const words = computed(
  () =>
    stats
      ?.map((w) => (poppedEmojis.value.includes(w[0]) ? ["", 0, 0, 0, 0, 0] : w))
      .sort((a, b) => {
        let aT = a[0] ? (emojiRe.test(a[0]) ? 1 : 0) : 1;
        let bT = b[0] ? (emojiRe.test(b[0]) ? 1 : 0) : 1;
        return aT - bT;
      }) ?? [],
);

function downloadSVG() {
  let svgFile = `<svg xmlns="http://www.w3.org/2000/svg" width="${CLOUD_WIDTH}" height="${CLOUD_HEIGHT}" viewBox="0,0,${CLOUD_WIDTH},${CLOUD_HEIGHT}" style="max-width: 100%; height: auto; font-family: Impact">${svgNode.value.innerHTML}</svg>`;

  saveFile(new Blob([svgFile], { type: "image/svg+xml" }), (name ?? "wordcloud") + ".svg");
}

function downloadCSV() {
  let csvFile = `word,count,weight\n`;

  stats.forEach((w) => {
    csvFile += `${w[0]},${w[1]},${w[2]}\n`;
  });

  saveFile(new Blob([csvFile], { type: "text/csv" }), (name ?? "wordcloud") + ".csv");
}

function popEmoji(event) {
  if (event.target.tagName != "text") {
    if (poppedEmojis.value.length) {
      poppedEmojis.value = [];
    }

    return;
  }

  let e = event.target.textContent.match(/\p{Emoji_Presentation}/u)?.[0];

  if (e) {
    poppedEmojis.value.push(e);
    sound.value.volume = 0.5;
    sound.value.play();
  } else {
    if (poppedEmojis.value.length) {
      poppedEmojis.value = [];
    }
  }
}

watch(
  () => stats,
  () => (poppedEmojis.value = []),
);
</script>

<template>
  <div style="text-align: left">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :width="CLOUD_WIDTH"
      :height="CLOUD_HEIGHT"
      :viewBox="`0,0,${CLOUD_WIDTH},${CLOUD_HEIGHT}`"
      style="max-width: 100%; height: auto; font-family: Impact"
      ref="svg"
      @click="popEmoji"
    >
      <g transform="translate(725,450)">
        <text
          v-for="(w, i) in words"
          :key="w[0]"
          :fill="getColor(i)"
          text-anchor="middle"
          :transform="`translate(${(w[4] % CLOUD_WIDTH) - CLOUD_WIDTH / 2},${((w[4] / CLOUD_WIDTH) | 0) - CLOUD_HEIGHT / 2})rotate(${w[3] * CLOUD_ROTATION_MULTIPLY - CLOUD_ROTATION_SHIFT})`"
          :style="`font-size: ${w[2]}px`"
        >
          <title>{{ Number(w[1]).toLocaleString() }}</title>
          {{ w[0] }}
        </text>
      </g>
    </svg>
    <p style="text-align: right; padding: 0; margin: 0; margin-block: 0; font-size: 10px">
      скачать: <a href="#" @click.prevent="downloadSVG">SVG</a> |
      <a href="#" @click.prevent="downloadCSV">CSV</a>
    </p>
  </div>
  <audio
    ref="pop"
    src="data:audio/ogg;base64,T2dnUwACAAAAAAAAAABFMgAAAAAAAFsAWEEBE09wdXNIZWFkAQE4AYC7AAAAAABPZ2dTAAAAAAAAAAAAAEUyAAABAAAAI2M9KwEtT3B1c1RhZ3MdAAAAbGlib3B1cyAxLjMsIGxpYm9wdXNlbmMgMC4yLjEAAAAAT2dnUwAECxoAAAAAAABFMgAAAgAAAEL5TeIHSWtZRUY9P3iAClEWOD+6cwqPgKje0odJzKRJG1O7lv71jfodawIZFqA1877ypCtqNYlR8ojYfvy6aPcacn1Ijz0DLtfecypHLsyromtoeE54re5l3xppVph9M7lMkEqwJIu4Rud32z9qLNcIFrq3y8DXWOHq9oLGC5pKFTZB4GNqgfj8qRB1MgxPWL5caPlgZP1DAdB9hm/e4EsR6O17T0gLvKGRgAE26ea/wuur6ayusuz+3mwVud9SyHieJlzc/LYAvZayiQucvSr5tbrmTuQ7Z3LDI8NeiRnv2bxOPViihmQz+2uS+rWs2vEqiDq18aKOq+koRRNCxzXjIKfe/EBC25mKmZBCkDKVig5e8pBO7yP2eCrZ6MmOz+DZ3I065UsQa5Lpgo07QkZIbFlbnCmhF6r0df1ljhnd5nlEWsuZPo8B2cWhvYj5mUjB2rEzUIwUH7tBMeImeCUZmNvXli1iEW+T9kwFKAghZut47SMbTRA/YYLzfkM+FCmrLMfONLCLrGgYqM1aU6YryvcqeE/Vkckl5ZJ+45NFBTkUsnggs/1yOufCitbnqq7cEyVAnlPKT8aB09LAr1Tn1l1nagVjPvCFxhoLaUQCKgdLkMCWsoFYhbSex+8DA+h4ETDCc7wJGvJZNS5eDSahVG8sGuZc7pYHIVKgcL/M7UoYy2PT7A71VKwT8SZJ2UiiY3/achA3li+5QkMEo6U="
  />
</template>

<style scoped>
/* text.accented {
  animation: 2s pulsate infinite;
}

@keyframes pulsate {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
} */
</style>
