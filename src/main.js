import "../css/pico.custom.min.css";
import "theme-toggles/css/within.min.css";
import { createApp } from "vue";
import { createPinia } from "pinia";
import { setFavIcon } from "@/utils/favico";
import App from "@/App.vue";

let ln = document.body.lastChild;
if (ln.nodeName == "svg") {
  ln = ln.lastChild;
}

setFavIcon();
const pinia = createPinia();

let mountNode = document.getElementById("app");

if (!mountNode) {
  mountNode = document.createElement("main");
  mountNode.id = "app";
  document.body.textContent = "";
  document.body.appendChild(mountNode);
}

mountNode.classList.add("container");

createApp(App, { packedSize: ln.textContent.length }).use(pinia).mount(mountNode);
