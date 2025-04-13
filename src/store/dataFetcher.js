import { readBin } from "../parser/binformat/index.js";

let STORAGE;
let _mode;

try {
  // This is specific to packed version. So we suppres ESLint here
  // eslint-disable-next-line no-undef
  STORAGE = $fs;
  _mode = STORAGE ? "packed" : "served";
} catch {
  _mode = "served";
}

export function loadData() {
  if (_mode == "packed") {
    return Promise.resolve({
      stats: readBin(STORAGE.u8("stats.bin")),
      storage: { list: STORAGE.list, abSize: STORAGE.b.byteLength },
      mode: _mode,
      appVersion: process.env.VITE_BUILD_VERSION,
    });
  }

  return fetch("/stats/stats.bin")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error, status = ${response.status}`);
      }
      return response.arrayBuffer();
    })
    .then((r) => ({
      stats: readBin(new Uint8Array(r)),
      storage: { list: {}, abSize: r.byteLength },
      mode: _mode,
      appVersion: process.env.VITE_BUILD_VERSION,
    }));
}
