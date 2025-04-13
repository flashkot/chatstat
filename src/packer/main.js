import "../../css/pico.custom.min.css";
import "theme-toggles/css/within.min.css";
import { createApp } from "vue";
import App from "./packer-app.vue";

let mountNode = document.getElementById("main");

if (!mountNode) {
  mountNode = document.createElement("main");
  mountNode.id = "app";
  mountNode.classList.add("container");
  document.body.textContent = "";
  document.body.appendChild(mountNode);
}

createApp(App).mount(mountNode);
