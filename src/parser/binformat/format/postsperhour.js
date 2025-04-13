import { readBitField, writeBitField } from "./bitfield.js";

export function readPostsPerHour(reader) {
  const result = {};
  let days = readBitField(reader);

  days.forEach((d) => {
    result[d] = {};
    let hours = readBitField(reader);
    hours.forEach((h) => (result[d][h] = reader.readInt()));
  });

  return {
    data: result,
    treeMap: {
      name: "Posts per wekday hour",
      value: reader.bytesRead(),
    },
  };
}

export function writePostsPerHour(writer, data) {
  let days = Object.keys(data).map(Number);
  days.sort((a, b) => a - b);

  writeBitField(writer, days);
  days.forEach((d) => {
    let weekday = data[d];

    let hours = Object.keys(weekday).map(Number);
    hours.sort((a, b) => a - b);
    writeBitField(writer, hours);
    hours.forEach((h) => writer.writeInt(data[d][h]));
  });

  return {
    name: "Posts per wekday hour",
    value: writer.bytesWritten(),
  };
}
