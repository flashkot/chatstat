<script setup>
import { nextTick, provide, ref, watch } from "vue";
import { useChatStore } from "@/store/store";
import MonthView from "@/views/monthView.vue";
import ThemeToggle from "@/components/theme-toggle.vue";
import MonthSelector from "@/components/monthSelector.vue";
import FullView from "./views/full-view.vue";
import UsersView from "./views/users-view.vue";
import InfoView from "./views/info-view.vue";
import GithubLinks from "./components/github-links.vue";

let userPrefTheme = "light";
if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
  userPrefTheme = "dark";
}

const { packedSize } = defineProps({ packedSize: Number });

const selectedTheme = ref(userPrefTheme);

provide("selectedTheme", selectedTheme);

const selectedMonth = ref("");
const selectedUser = ref("");
const mode = ref("month");

const store = useChatStore();
store.packedSize = packedSize;

store.fetchData().then(() => {
  selectedMonth.value = store.latestMonth;

  parseLocation();
  history.replaceState("", "", document.location.href);
});

watch(selectedTheme, () => {
  if (selectedTheme.value) {
    document.documentElement.dataset.theme = selectedTheme.value;
  }
});

function navigateTo(toMode, itemId) {
  applyNavigate(toMode, itemId);
  nextTick(() => history.pushState("", "", `#/${toMode}/${itemId ?? ""}`));
}

provide("navigateTo", navigateTo);

function applyNavigate(toMode, itemId) {
  mode.value = toMode;

  selectedMonth.value = "";
  selectedUser.value = "";
  let pageTitle = "ЧатСтат: " + store.stats.name;

  if (mode.value == "month") {
    selectedMonth.value = String(itemId ?? "");
    pageTitle += " - " + (itemId ?? "");
  } else if (mode.value == "users") {
    selectedUser.value = String(itemId ?? "");
    pageTitle += " - " + store.stats.users[Number(itemId) || store.usersList[0].value]?.name;
  }
  if (mode.value == "full") {
    pageTitle += " - за всё время";
  }
  if (mode.value == "info") {
    pageTitle += " - о файле";
  }

  window.scrollTo(0, 0);

  let title = document.querySelector("head title");

  if (!title) {
    title = document.createElement("head");
    document.querySelector("head").appendChild(title);
  }

  title.textContent = pageTitle;
}

function parseLocation() {
  let hashParts = window.location.hash.replace(/^#\//, "").split("/");
  if (hashParts[0]) {
    applyNavigate(hashParts[0], hashParts[1]);
  } else {
    applyNavigate("month", store.latestMonth);
  }
}

window.addEventListener("popstate", parseLocation);
</script>

<template>
  <nav>
    <ul>
      <li>
        <strong>{{ store.stats?.name }}. ЧатСтат за</strong>
        <MonthSelector
          :modelValue="selectedMonth"
          @update:modelValue="(ev) => navigateTo('month', ev)"
          :month-list="store.monthList"
          v-if="store.isLoaded"
          placeholder="месяц?"
        />
      </li>
      <li><span class="separator"></span></li>
      <li>
        <a
          v-if="mode != 'full'"
          href="#"
          @click.prevent="navigateTo('full')"
          :aria-current="mode == 'full' ? 'page' : ''"
          >за всё время</a
        ><span v-else>за всё время</span>
      </li>
      <li><span class="separator"></span></li>
      <li>
        <a
          v-if="mode != 'users'"
          href="#"
          @click.prevent="navigateTo('users')"
          :aria-current="mode == 'users' ? 'page' : ''"
          >участники</a
        ><span v-else>участники</span>
      </li>
    </ul>
    <ul>
      <li>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          width="1em"
          height="1em"
          style="cursor: pointer"
          @click.prevent="navigateTo('info')"
        >
          <!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. -->
          <path
            d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"
          />
        </svg>
      </li>
      <li>
        <ThemeToggle v-model="selectedTheme" />
      </li>
    </ul>
  </nav>
  <section v-if="store.isLoaded">
    <MonthView v-if="mode == 'month'" :selectedMonth="selectedMonth || store.latestMonth" />
    <FullView v-if="mode == 'full'" />
    <UsersView v-if="mode == 'users'" :showUser="selectedUser" />
    <InfoView v-if="mode == 'info'" />
  </section>
  <footer>
    <hr />
    <nav>
      <GithubLinks />
      <p>
        Сгенерировано
        {{ new Date(store.stats?.genTime * 1000).toLocaleString("ru-RU") }}
      </p>
    </nav>
  </footer>
</template>

<style>
main {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

footer {
  margin-top: auto;
  font-size: 12px;
}

nav select:not(:focus) {
  border-color: #0000;
  background-color: #0000;
}

nav span.separator {
  border-left: 2px solid var(--muted-border-color);
  height: 1me;
}
</style>
