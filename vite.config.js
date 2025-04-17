import { fileURLToPath, URL } from "node:url";
import { execSync } from "node:child_process";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { visualizer } from "rollup-plugin-visualizer";

import jsConfig from "./jsconfig.json";

let modes = {
  chatstat: {
    bundleName: "chatstat",
    entry: "src/main.js",
    outDir: "dist/chatstat/",
  },
  chatstatcreator: {
    bundleName: "chatstatcreator",
    entry: "src/packer/main.js",
    outDir: "dist/chatstatcreator/",
  },
  worker: {
    bundleName: "chatstat.worker",
    entry: "src/packer/parseandpack.worker.js",
    outDir: "dist/chatstatworker/",
  },
};

function getAliases(paths) {
  let aliases = {};

  for (let alias in paths) {
    aliases[alias.replace(/\/\*$/, "")] = fileURLToPath(
      new URL(paths[alias][0].replace(/\/\*$/, ""), import.meta.url),
    );
  }

  return aliases;
}

const gitDescribe = JSON.stringify(execSync("git describe --tags --dirty").toString().trimEnd());

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  let definitions = {
    "process.env.VITE_BUILD_VERSION": gitDescribe,
  };

  let plugins = [vue(), vueDevTools(), cssInjectedByJsPlugin()];

  let selectedMode = modes.chatstat;

  if (command == "build") {
    if (modes[mode]) {
      selectedMode = modes[mode];
    }

    definitions["process.env.NODE_ENV"] = '"production"';
    plugins.push(
      visualizer({
        filename: `${selectedMode.outDir}/bundle-stats.html`,
        sourcemap: true,
      }),
    );
  }

  let config = {
    plugins,
    resolve: { alias: getAliases(jsConfig.compilerOptions.paths) },
    define: definitions,
    build: {
      sourcemap: "hidden",
      outDir: selectedMode.outDir,
      target: "esnext",
      minify: "terser",
      terserOptions: {
        module: true,
      },
      assetsDir: "",
      lib: {
        entry: selectedMode.entry,
        fileName: selectedMode.bundleName,
        name: selectedMode.bundleName,
        formats: ["iife"],
      },
    },
  };

  return config;
});
