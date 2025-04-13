<script setup>
import { nextTick, ref, useTemplateRef, watch } from "vue";
import ThemeToggle from "@/components/theme-toggle.vue";
import { getWorker } from "./getworker";
import { saveFile } from "@/utils/savefile";

const buildVersion = process.env.VITE_BUILD_VERSION;

const selectedTheme = ref("light");

if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
  selectedTheme.value = "dark";
}

watch(selectedTheme, () => {
  if (selectedTheme.value) {
    document.documentElement.dataset.theme = selectedTheme.value;
  }
});

const filePicker = useTemplateRef("file-item");
const logTextArea = useTemplateRef("log-view");

const WORKER = ref(null);
getWorker().then((w) => {
  w.addEventListener("message", onWorkerMessage);
  WORKER.value = w;
});

const step = ref("file");
const canSelectFile = ref(true);
const loadingFile = ref(false);
const errorMessage = ref("");
const config = ref("");
const chatName = ref("");
const lastTS = ref("");
const skipLastMonth = ref(true);
const ignoreUnknownUsers = ref(true);
const logText = ref("");
const fileName = ref("");
const fileData = ref("");
const renderProgress = ref(null);
const maxProgress = ref(null);

const readFile = async (e) => {
  e.preventDefault();

  if (!canSelectFile.value) {
    return;
  }

  try {
    let file;

    if (e.dataTransfer?.items) {
      file = e.dataTransfer.items[0].getAsFile();
    } else {
      file = e.target.files[0];
    }

    let fileStream = file.stream();
    WORKER.value.postMessage(fileStream, [fileStream]);
    loadingFile.value = true;
    canSelectFile.value = false;
    errorMessage.value = "";
  } catch (e) {
    showError(e);
  }

  filePicker.value.value = null;
};

window.ondrop = readFile;
window.ondragover = (e) => e.preventDefault();

function showError(e) {
  if (step.value == "file") {
    loadingFile.value = false;
    canSelectFile.value = true;
  }

  errorMessage.value = e;
}

function startGeneration() {
  let cfg;
  try {
    cfg = JSON.parse(config.value);
    cfg = JSON.stringify({
      includeLastMonth: !skipLastMonth.value,
      ignoreUnknownUsers: ignoreUnknownUsers.value,
      users: cfg,
    });
  } catch (e) {
    showError(e);
    return;
  }

  WORKER.value.postMessage({ config: cfg });
  WORKER.value.postMessage({ action: "pack" });
  step.value = "generate";
  errorMessage.value = "";
}

function downloadFile() {
  if (!fileData.value) {
    return;
  }

  saveFile(
    new Blob([fileData.value], { type: "text/html" }),
    (fileName.value ?? "ChatStat") + ".html",
  );
}

function onWorkerMessage({ data }) {
  if (data.error) {
    showError(data.error);
    return;
  }

  if (data.jsonLoaded) {
    WORKER.value.postMessage({ query: "users" });
  }

  if (data.users) {
    config.value = JSON.stringify(JSON.parse(data.users), null, 2);
    chatName.value = data.chatName;
    lastTS.value = new Date(data.lastTS * 1000).toLocaleDateString("ru-RU");

    let dF = new Date(data.firstTS * 1000);
    let dL = new Date(data.lastTS * 1000);

    if (dF.getFullYear() == dL.getFullYear() && dF.getMonth() == dL.getMonth()) {
      skipLastMonth.value = false;
    }

    step.value = "config";
  }

  if (data.progress) {
    logText.value += data.progress + "\n";
    maxProgress.value = data.total ?? null;
    renderProgress.value = data.done ?? null;

    nextTick().then(() => (logTextArea.value.scrollTop = logTextArea.value.scrollHeight + 1000));
  }

  if (data.finished) {
    fileData.value = data.data;
    fileName.value = data.fileName;
  }
}
</script>

<template>
  <nav>
    <ul>
      <li>
        <h1>ChatStat Creator</h1>
      </li>
    </ul>
    <ul>
      <li>
        <small>Версия {{ buildVersion }}</small>
      </li>
      <li>
        <ThemeToggle v-model="selectedTheme" />
      </li>
    </ul>
  </nav>
  <article v-if="WORKER !== null">
    <div v-if="step == 'file'">
      <p>
        Для начала нам потребуется экспорт сообщений из чата телеграма. Файлик
        <code>result.json</code>.
      </p>
      <input id="file-item" ref="file-item" type="file" accept=".json" @change="readFile" />
      <p v-if="!loadingFile">
        <button @click="filePicker.click()">Выберите файл</button>
        <br />
        <br />
        <em>(Ну или можно прям на страницу перетащить)</em>
      </p>
      <p aria-busy="true" v-if="loadingFile">Обождите, происходит грузинг...</p>
    </div>

    <div v-if="step == 'config'">
      <h4>Генерируем статистику для чата: {{ chatName }}</h4>
      <p>
        Тут можно отредактировать имена, указать @собак (к сожалению в JSON-е этой инфы нет)<br />
        Можно даже скопипастить себе отредактированный вариант куда-нибудь на будущее. <br />
        В <code>alias</code> указываем @собак. В <code>aka</code> перечисляем прошлых @собак
        пользователя.
      </p>
      <textarea v-model="config"></textarea>
      <label for="skip-last">
        <input v-model="skipLastMonth" type="checkbox" id="skip-last" role="switch" />
        Не включать в статистику
        <span :data-tooltip="'Последнее сообщение в логе от ' + lastTS">последний месяц</span>.
      </label>
      <label for="ignore-unknown">
        <input v-model="ignoreUnknownUsers" type="checkbox" id="ignore-unknown" role="switch" />
        Игнорировать пользователей, которых нет в списке.
      </label>
      <label>
        <input type="checkbox" role="switch" /> Использовать метод Леркина-Зельдеровича для
        эллиптических кривых (экспериментальное!).
      </label>
      <label> <input type="checkbox" role="switch" /> Пожаловаться на убогий интерфейс. </label>
      <br />
      <button id="compress" @click="startGeneration">Сгенерировать!</button>
      <br />
      <br />
    </div>

    <div v-if="step == 'generate'">
      <h4>Генерируем статистику для чата: {{ chatName }}</h4>
      <p>
        Процесс генерации ЧатСтата весьма небыстрый. Ну хоть на лог можно посмотреть, пока процессор
        вырабатывает тепло.
      </p>
      <textarea ref="log-view" disabled v-model="logText"></textarea>
      <progress v-if="!fileName" :value="renderProgress" :max="maxProgress" />
      <button id="download" v-if="fileName" @click="downloadFile">Скачать ЧатСтат</button>
    </div>

    <article v-if="errorMessage" class="error">
      <header><strong>Ошибка!</strong></header>
      {{ errorMessage }}
    </article>
  </article>
  <footer>
    <hr />
    <small class="smaller">
      Сделано с использованием: <a href="https://vuejs.org/" target="_blank">vue.js</a>,
      <a href="https://picocss.com/" target="_blank">pico.css</a>,
      <a href="https://toggles.dev/" target="_blank">toggles.dev</a>,
      <a href="https://github.com/jasondavies/d3-cloud" target="_blank">d3-cloud</a>,
      <a href="https://gitlab.com/rockerest/fast-mersenne-twister" target="_blank"
        >fast-mersenne-twister</a
      >, <a href="https://github.com/mazko/jssnowball" target="_blank">Snowball</a>,
      <a href="https://github.com/mathiasbynens/punycode.js" target="_blank">punycode</a>,

      <br />
      Сжатие вариантом алгоритма zopfli из
      <a href="https://github.com/fhanau/Efficient-Compression-Tool" target="_blank"
        >Efficient Compression Tool</a
      >
    </small>
  </footer>
</template>

<style>
nav h1 {
  margin: 0;
}

#file-item {
  display: none;
}

.error {
  background-color: #b21e4f;

  color: white;
}

.error header {
  background-color: #88143b;
  border-bottom-color: #b21e4f;
}

textarea {
  min-height: 400px;
  font-family: var(--font-family-monospace);
  pointer-events: auto !important;
}

main {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

footer {
  margin-top: auto;
}

.smaller,
.smaller * {
  font-size: 12px;
  line-height: 12px;
}
</style>
