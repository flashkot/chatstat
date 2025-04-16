import { readFileSync, writeFileSync } from "node:fs";
import { pack } from "jspackcompress";

let worker = readFileSync("./dist/chatstatworker/chatstat.worker.iife.js");
let mainScript = readFileSync("./dist/chatstatcreator/chatstatcreator.iife.js", "utf-8");
let chatstatScript = readFileSync("./dist/chatstat/chatstat.iife.js");

let opts = {
  compressionlevel: 9,
  script: mainScript,
  compactHtml: false,
  universalDecoder: true,
  extraHead:
    '<title>ChatStat Creator</title><meta name="viewport" content="width=device-width, initial-scale=1.0"/>',
  extraBody: "",
  files: {
    "creator.worker.js": { content: worker },
    "chatstat.iife.js": { content: chatstatScript },
  },
};

let result = await pack(opts);

writeFileSync(`./dist/chatstatcreator.html`, result.payload);
