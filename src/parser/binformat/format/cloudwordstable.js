import { readArrayOfInts, writeArrayOfInts } from "./arrays.js";

export function readCloudWordsList(reader) {
  let children = [];

  let result = [];

  let alphabet = readArrayOfInts(reader);
  children.push({ name: "alphabet", value: reader.bytesRead() });

  let ccArray = readArrayOfInts(reader);

  let word = "";

  ccArray.forEach((cc) => {
    cc = alphabet[cc];
    if (cc === 0) {
      result.push(word);
      word = "";
      return;
    }

    word += String.fromCodePoint(cc);
  });

  children.push({ name: "words", value: reader.bytesRead() });

  return {
    data: result,
    treeMap: {
      name: "Words Table",
      children,
    },
  };
}

export function writeCloudWordsList(writer, data) {
  let children = [];

  let alphabet = { 0: 0 };

  for (let w in data) {
    let word = data[w];

    for (let c of word) {
      let cc = c.codePointAt();

      if (!alphabet[cc]) alphabet[cc] = 0;
      alphabet[cc]++;
    }

    alphabet[0]++;
  }

  alphabet = Object.entries(alphabet)
    .sort((a, b) => b[1] - a[1])
    .map((a) => Number(a[0]));

  writeArrayOfInts(writer, alphabet);
  children.push({ name: "alphabet", value: writer.bytesWritten() });

  let ccArray = [];
  let nullByte = alphabet.indexOf(0);

  for (let w in data) {
    let word = data[w];

    for (let c of word) {
      let cc = c.codePointAt();
      ccArray.push(alphabet.indexOf(cc));
    }

    ccArray.push(nullByte);
  }

  writeArrayOfInts(writer, ccArray);

  children.push({ name: "words", value: writer.bytesWritten() });

  return {
    name: "Words Table",
    children,
  };
}
