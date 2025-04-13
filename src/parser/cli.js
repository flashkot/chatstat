import { fileURLToPath, pathToFileURL } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";

import Canvas from "canvas";
import { createStopwatch } from "./utils/perftimer.js";
import { compareDeep } from "./utils/comparedeep.js";
import { parseJson, readBin, writeBin } from "./index.js";

Canvas.registerFont("C:/Windows/Fonts/impact.ttf", { family: "zozo" });
Canvas.registerFont("C:/Windows/Fonts/seguiemj.ttf", {
  family: "keke",
});

function getCanvas() {
  let canvas = Canvas.createCanvas(1, 1);
  let _origGetContext = canvas.getContext;

  canvas.getContext = (...params) => {
    let ctx = _origGetContext.apply(canvas, params);
    ctx.patternQuality = "fast";
    ctx.quality = "fast";
    ctx.textDrawingMode = "glyph";
    ctx.antialias = "none";

    return ctx;
  };

  return canvas;
}

const fonrSelector = (w) => {
  if (/(\p{Emoji_Presentation})/u.test(w.text)) {
    return "keke";
  } else {
    return "zozo";
  }
};

const sw = createStopwatch();
const inData = JSON.parse(readFileSync(process.argv[2], "utf8"));

let confFile;
let config = {};

try {
  confFile = fileURLToPath(new URL("./config.json", pathToFileURL(process.argv[2])));
  config = JSON.parse(readFileSync(confFile, "utf8"));
} catch {
  console.log("no config found");
}

console.log("File loaded in: " + sw.time());

let renderTime = 0;
let dataForBin;

for await (let ret of parseJson(inData, config, getCanvas(), fonrSelector)) {
  renderTime += sw.time();
  let eta = ret.progress
    ? ` (${ret.progress}/${ret.total}, ETA: ${((renderTime / ret.progress) * (ret.total - ret.progress)) | 0}s)`
    : "";

  console.log(ret.message + eta);

  if (ret.data) {
    dataForBin = ret.data;
  }
}

writeFileSync(process.argv[3] + ".result.json", JSON.stringify(dataForBin, null, 2));

let binForm = writeBin(dataForBin);
console.log("Bin form created in: " + sw.time());

let decoded = readBin(binForm.data);
console.log("Bin decoded in: " + sw.time());

writeFileSync(process.argv[3] + ".bin", binForm.data);
writeFileSync(process.argv[3] + ".bin.json", JSON.stringify(decoded.data));
writeFileSync(process.argv[3] + ".decTreeMap.json", JSON.stringify(decoded.treeMap));

console.log("Saved to files in: " + sw.time());

sortWordClouds(dataForBin.wordClouds);
sortWordClouds(decoded.data.wordClouds);

//assert.deepStrictEqual(decoded.data, dataForBin);
if (compareDeep(decoded.data, dataForBin, true)) {
  console.log("Output validated in: " + sw.time());
} else {
  throw new Error("Validation failed!");
}

function sortWordClouds(data) {
  const collator = new Intl.Collator("ru", {
    usage: "sort",
    sensetivity: "accent",
    numeric: true,
  });

  const strCompare = collator.compare;

  data.total.sort((a, b) => strCompare(a[0], b[0]));

  for (let m in data.months) {
    data.months[m].sort((a, b) => strCompare(a[0], b[0]));
  }

  for (let u in data.users) {
    data.users[u].sort((a, b) => strCompare(a[0], b[0]));
  }
}

console.log("\n-----\nAll done in: " + sw.fromStart());
