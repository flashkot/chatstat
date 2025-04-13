import "../../css/pico.custom.min.css";
import "theme-toggles/css/within.min.css";
import { createApp } from "vue";
import App from "./packer-app.vue";

let mountNode = document.getElementById("app");

if (!mountNode) {
  mountNode = document.createElement("main");
  mountNode.id = "app";
  document.body.textContent = "";
  document.body.appendChild(mountNode);
}

mountNode.classList.add("container");

createApp(App).mount(mountNode);
