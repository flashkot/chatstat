import { parseJson, writeBin } from "../parser/index.js";
import { pack } from "jspackcompress";
import { createStopwatch } from "../parser/utils/perftimer.js";

let loadedJson;
let config;
let mainScript;

self.addEventListener("message", (event) => {
  let data = event.data;

  if (data instanceof ReadableStream) {
    new Response(data)
      .json()
      .then((json) => {
        loadedJson = json;
        self.postMessage({ jsonLoaded: true });
      })
      .catch((e) => {
        self.postMessage({ action: "read file", error: e });
      });
  }

  if (data.config) {
    config = JSON.parse(data.config);
  }

  if (data.mainScript) {
    mainScript = data.mainScript;
  }

  if (data.query == "users") {
    sendUsers();
  }

  if (data.action == "pack") {
    parseAndPack();
  }
});

function sendUsers() {
  if (!Array.isArray(loadedJson?.messages)) {
    self.postMessage({
      action: "reading users",
      error: "Это какой-то неправильный JSON. Не знаю что с ним делать.",
    });
    return;
  }

  let users = {};

  loadedJson.messages.forEach((msg) => {
    if (msg.from_id && !users[msg.from_id]) {
      users[msg.from_id] = {
        // id: msg.from_id,
        name: msg.from,
        alias: "",
        aka: [],
      };
    }
  });

  self.postMessage({
    chatName: loadedJson.name,
    lastTS: loadedJson.messages.at(-1).date_unixtime,
    firstTS: loadedJson.messages.at(0).date_unixtime,
    users: JSON.stringify(users),
  });
}

async function parseAndPack() {
  let renderTime = 0;
  let dataForBin;

  try {
    const canvas = new OffscreenCanvas(1, 1);

    const sw = createStopwatch();

    for await (let ret of parseJson(loadedJson, config, canvas)) {
      renderTime += sw.time();
      let eta = ret.progress
        ? ` (${ret.progress}/${ret.total}, ETA: ${((renderTime / ret.progress) * (ret.total - ret.progress)) | 0}s)`
        : "";

      // console.log(ret.message + eta);
      self.postMessage({ progress: ret.message + eta, done: ret.progress, total: ret.total });

      if (ret.data) {
        dataForBin = ret.data;
      }
    }

    let year = Object.keys(dataForBin.monthly).sort().at(-1);
    let month = Object.keys(dataForBin.monthly[year]).sort().at(-1);

    month = String(Number(month) + 1).padStart(2, "0");

    let fileName = `${dataForBin.name}-${year}-${month}`;

    let binForm = writeBin(dataForBin);
    self.postMessage({ progress: "Stats generated and packed." });

    self.postMessage({ progress: "Creating ChatStat HTML..." });

    let opts = {
      compressionlevel: 9,
      script: mainScript,
      compactHtml: false,
      extraHead:
        '<meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>ChatStat</title>',
      extraBody: "",
      files: {
        "stats.bin": {
          content: binForm.data,
          lable: "stats.bin",
        },
      },
    };

    let result = await pack(opts);
    self.postMessage({ progress: "\nAll done!" });
    self.postMessage({ finished: true, fileName, data: result.payload.buffer }, [
      result.payload.buffer,
    ]);
  } catch (e) {
    self.postMessage({ action: "creating chatstat", error: e });
  }
}
