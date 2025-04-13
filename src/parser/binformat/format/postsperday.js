import { readBitField, writeBitField } from "./bitfield.js";

export function readPostsPerDay(reader) {
  const result = {};
  let days = readBitField(reader);

  days.forEach((d) => (result[d] = reader.readInt()));

  return {
    data: result,
    treeMap: {
      name: "Posts per day",
      value: reader.bytesRead(),
    },
  };
}

export function writePostsPerDay(writer, data) {
  let listsIds = Object.keys(data).map(Number);
  listsIds.sort((a, b) => a - b);

  writeBitField(writer, listsIds);
  listsIds.forEach((i) => writer.writeInt(data[i]));

  return {
    name: "Posts per day",
    value: writer.bytesWritten(),
  };
}
