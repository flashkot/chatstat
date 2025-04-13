import { readBitField, writeBitField } from "./bitfield.js";

export function readUsersPostsPerDay(reader) {
  let result = {};

  let numYears = reader.readInt();

  for (let i = 0; i < numYears; i++) {
    let Y = reader.readInt();

    result[Y] = {};

    let months = readBitField(reader);

    months.forEach((M) => {
      result[Y][M] = {};
      let days = readBitField(reader);

      days.forEach((d) => (result[Y][M][d] = reader.readInt()));
    });
  }

  return {
    data: result,
    treeMap: {
      name: "Users total posts per day",
      value: reader.bytesRead(),
    },
  };
}

export function writeUsersPostsPerDay(writer, data) {
  let years = Object.keys(data).map(Number);
  years.sort((a, b) => a - b);

  writer.writeInt(years.length);

  years.forEach((Y) => {
    let months = Object.keys(data[Y]).map(Number);
    months.sort((a, b) => a - b);

    writer.writeInt(Y);
    writeBitField(writer, months);

    months.forEach((M) => {
      let days = Object.keys(data[Y][M]).map(Number);
      days.sort((a, b) => a - b);

      writeBitField(writer, days);
      days.forEach((i) => writer.writeInt(data[Y][M][i]));
    });
  });

  return {
    name: "Users total posts per day",
    value: writer.bytesWritten(),
  };
}
