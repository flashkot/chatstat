// simple varint writer/reader

//INFO: keep in mid that MAX_SAFE_INTEGER in js is 9_007_199_254_740_991

export function createWriter() {
  const data = [];
  let lastWritePos = 0;

  function bytesWritten() {
    let size = data.length - lastWritePos;
    lastWritePos = data.length;

    return size;
  }

  function getPos() {
    return data.length;
  }

  function writeInt(value) {
    value = Number(value);

    while (value > 127) {
      data.push((value % 128) + 128);
      value = Math.floor(value / 128);
    }

    data.push(value);
  }

  function writeByte(value) {
    data.push(value);
  }

  function writeStr(str) {
    str = String(str);

    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);

      if (c < 128) {
        data.push(c);
      } else if (c < 2048) {
        data.push((c >> 6) | 192, (c & 63) | 128);
      } else if (
        (c & 0xfc00) == 0xd800 &&
        i + 1 < str.length &&
        (str.charCodeAt(i + 1) & 0xfc00) == 0xdc00
      ) {
        // Surrogate Pair
        c = 0x10000 + ((c & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
        data.push((c >> 18) | 240, ((c >> 12) & 63) | 128, ((c >> 6) & 63) | 128, (c & 63) | 128);
      } else {
        data.push((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128);
      }
    }

    data.push(0);
  }

  return {
    data,
    writeInt,
    writeByte,
    writeStr,
    bytesWritten,
    getPos,
  };
}

export function createReader(data) {
  let pos = 0;
  let lastReadPos = 0;

  function bytesRead() {
    let size = pos - lastReadPos;
    lastReadPos = pos;

    return size;
  }

  function getPos() {
    return pos;
  }

  function readInt() {
    if (pos >= data.length) {
      return undefined;
    }

    let value = 0;
    let shift = 0;

    while (data[pos] > 127) {
      value += (data[pos++] & 127) * 128 ** shift;
      shift++;
    }

    return value + (data[pos++] & 127) * 128 ** shift;
  }

  function readByte() {
    if (pos >= data.length) {
      return undefined;
    }

    return data[pos++];
  }

  function readStr() {
    if (pos >= data.length) {
      return undefined;
    }

    let out = "",
      c1,
      c2,
      c3,
      c4,
      u;

    while (pos < data.length) {
      c1 = data[pos++];

      if (c1 === 0) {
        return out;
      }

      if (c1 < 128) {
        out += String.fromCharCode(c1);
      } else if (c1 > 191 && c1 < 224) {
        c2 = data[pos++];
        out += String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else if (c1 > 239) {
        // Surrogate Pair
        c2 = data[pos++];
        c3 = data[pos++];
        c4 = data[pos++];
        u = ((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63);
        out += String.fromCodePoint(u);
      } else {
        c2 = data[pos++];
        c3 = data[pos++];
        out += String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
    }

    return out;
  }

  return {
    data,
    readInt,
    readByte,
    readStr,
    bytesRead,
    getPos,
  };
}
