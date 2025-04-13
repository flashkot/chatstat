import { MersenneTwister } from "fast-mersenne-twister";
import cloud from "d3-cloud";
import {
  CLOUD_HEIGHT,
  CLOUD_ROTATION_MULTIPLY,
  CLOUD_ROTATION_SHIFT,
  CLOUD_WIDTH,
} from "../conf.js";

let layout;

/**
 * Prepare d3 cloud layout fro rendering
 *
 * @param {HTMLElement} canvas `canvas` node for clouds rendering
 */
export function prepareLayout(canvas) {
  layout = cloud().size([CLOUD_WIDTH, CLOUD_HEIGHT]).canvas(canvas);
}

/**
 * Perform rendering of word cloud and returns array with computed values
 *
 * @param {Object} data statistics for word cloud
 * @param {Number} seed integer dor PRNG initialization
 * @param {String|Function} font font name to use.
 * @returns {Array} Array for word cloud rendere
 */
export function renderWordCloud(data, seed, font) {
  return new Promise((resolve, reject) => {
    const mt = MersenneTwister(seed);

    let min = Infinity;
    let max = -Infinity;
    let maxEmoji = -Infinity;
    let emojiScale = 1;

    const words = data.map((e) => {
      let s = e.weight;

      min = Math.min(min, s);

      let emojiText;
      if (/(\p{Emoji_Presentation})/u.test(e.word)) {
        emojiText = "😁";
        maxEmoji = Math.max(maxEmoji, s);
      } else {
        emojiText = e.word;
        max = Math.max(max, s);
      }

      return { text: emojiText, size: s, _text: e.word, _count: e.count, _weight: e.weight };
    });

    // FIXME: this shouldn't be here. This must be part of data prep step
    if (maxEmoji > max) {
      emojiScale = max / maxEmoji;
    }

    if (max == min) {
      min -= 1;
    }

    try {
      layout
        .stop()
        .words(words)
        .padding(2)
        .rotate(() => Math.round(mt.random() * 6) * CLOUD_ROTATION_MULTIPLY - CLOUD_ROTATION_SHIFT)
        .random(() => mt.random())
        .font(font ?? "Impact")
        .fontSize(function (d) {
          let plus;

          if (/(\p{Emoji_Presentation})/u.test(d.text)) {
            plus = (d.size * emojiScale - min) / (max - min);
          } else {
            plus = (d.size - min) / (max - min);
          }
          // Emoji scaling can lead to negative sizes.
          // NOTE: doublr `sqrt` here. This was introducec by mistake initially
          // It was in two different places.
          // But looks of the graph is nice this way. So i decided to keep it
          return Math.floor(Math.max(15 + 65 * Math.cbrt(plus), 10));
        })
        .on("end", (data) => {
          let jsonFile = [];

          data.forEach((w) => {
            // just store the rotation "type" not the calculated angle itself
            let rot = (w.rotate + CLOUD_ROTATION_SHIFT) / CLOUD_ROTATION_MULTIPLY;
            // 0,0 on graph is in the center. And graph is 1450x900.
            // We will exploit that to store positin as one integer instead of two.
            // Basically position of the pixel in framebuffer.
            let pos = (w.y + CLOUD_HEIGHT / 2) * CLOUD_WIDTH + w.x + CLOUD_WIDTH / 2;
            jsonFile.push([w._text, w._count, w.size, rot, pos]);
          });

          resolve(jsonFile);
        })
        .start();
    } catch (e) {
      reject(e);
    }
  });
}
