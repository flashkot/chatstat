import { prepareLayout, renderWordCloud } from "./cloud/cloudrender.js";
import { calcBustle } from "./stats/bustle.js";
import { generateStats } from "./stats/statsgen.js";
export { writeBin, readBin } from "./binformat/index.js";
export { generateStats, parseJson };

/**
 * Generator function for generating statistics telegram chat exports and
 * prerendering word clouds.
 *
 * @param {Object} data parsed JSON from telegram chat export
 * @param {Object} config object with users info
 * @param {String|Function} font font name to use.
 * @param {HTMLElement} canvasNode `canvas` node for clouds rendering
 */
async function* parseJson(data, config, canvasNode, font) {
  yield { message: "Calculating stats from JSON..." };

  let result = generateStats(data, config);
  let wordsStats = result.wordsStats;
  let clouds = {
    users: {},
    months: {},
  };

  // 1 here is for all-tme (total) cloud
  let cloudsToRender = wordsStats.getCloudsNum();

  yield { message: "Done", progress: 0, total: cloudsToRender };
  if (result.skippedUnknown) {
    yield {
      message: "Skipped messages from unknown users: " + result.skippedUnknown,
      progress: 0,
      total: cloudsToRender,
    };
  }

  yield { message: '\nCalculating "bustle"...' };
  calcBustle(result.messages, result.messagesById, result.stats.monthly);
  yield { message: "Done" };

  yield { message: "\nRendering word clouds", progress: 0, total: cloudsToRender };

  let cloudCount = 1;

  if (!canvasNode) {
    canvasNode = document.createElement("canvas");
  }

  prepareLayout(canvasNode);
  wordsStats.preCalc();

  let chatSeed = Number(String(data.id).replace(/[^0-9]/g));

  clouds.total = await renderWordCloud(wordsStats.getAllTimeCloud(), chatSeed, font);

  yield { message: "All-time cloud rendered", progress: cloudCount, total: cloudsToRender };

  for (let r of wordsStats.monthsTotal) {
    let m = r[0];

    clouds.months[m] = await renderWordCloud(
      wordsStats.getMonthCloud(m),
      chatSeed + Number(m.replace(/[^0-9]/g, "")),
      font,
    );

    cloudCount++;

    yield { message: "Cloud rendered for month " + m, progress: cloudCount, total: cloudsToRender };
  }

  for (let r of wordsStats.usersTotal) {
    let u = r[0];

    clouds.users[u] = await renderWordCloud(wordsStats.getUserCloud(u), chatSeed + Number(u), font);

    cloudCount++;

    yield { message: "Cloud rendered for user " + u, progress: cloudCount, total: cloudsToRender };
  }

  yield {
    message: "Done",
    data: {
      name: data.name,
      genTime: (Date.now() / 1000) | 0,
      ...result.stats,
      wordClouds: clouds,
    },
  };
}
