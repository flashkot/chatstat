import { readBitField, writeBitField } from "./bitfield.js";
import { readPostsPerDay, writePostsPerDay } from "./postsperday.js";
import { readPostsPerHour, writePostsPerHour } from "./postsperhour.js";
import { readStatsList, writeStatsList } from "./statslist.js";
import { readUsersMonthly, writeUsersMonthly } from "./usersmonthly.js";

export function readMonthlyStats(reader, context) {
  let result = {};

  let children = [];
  let headersSize = 0;

  let numYears = reader.readInt();
  headersSize += reader.bytesRead();

  for (let i = 0; i < numYears; i++) {
    let Y = reader.readInt();

    let sY = {
      name: Y,
      value: 0,
      children: [],
    };

    result[Y] = {};

    let months = readBitField(reader);
    sY.value += reader.bytesRead();

    months.forEach((M) => {
      result[Y][M] = {};

      let sM = {
        name: Number(M) + 1,
        children: [],
      };
      let ret;

      ret = readUsersMonthly(reader, context);
      result[Y][M].users = ret.data;
      sM.children.push(ret.treeMap);

      ret = readPostsPerDay(reader, context);
      result[Y][M].postPerDay = ret.data;
      sM.children.push(ret.treeMap);

      ret = readPostsPerHour(reader, context);
      result[Y][M].postPerWeekHour = ret.data;
      sM.children.push(ret.treeMap);

      ret = readStatsList(reader, context);
      sM.children.push(ret.treeMap);

      for (let list in ret.data) {
        result[Y][M][list] = ret.data[list];
      }

      sM.value = Object.values(sM.children).reduce((p, v) => p + v.value, 0);
      delete sM.children;

      sY.children.push(sM);
    });

    children.push(sY);
  }

  return {
    data: result,
    treeMap: {
      name: "Monthly",
      value: headersSize,
      children,
    },
  };
}

export function writeMonthlyStats(writer, data, context) {
  let children = [];
  let headersSize = 0;

  let years = Object.keys(data).map(Number);
  years.sort((a, b) => a - b);

  writer.writeInt(years.length);
  headersSize += writer.bytesWritten();

  years.forEach((Y) => {
    let sY = {
      name: Y,
      value: 0,
      children: [],
    };

    let months = Object.keys(data[Y]).map(Number);
    months.sort((a, b) => a - b);

    writer.writeInt(Y);
    writeBitField(writer, months);
    sY.value += writer.bytesWritten();

    months.forEach((M) => {
      let sM = {
        name: M,
        children: [],
      };

      sM.children.push(writeUsersMonthly(writer, data[Y][M].users, context));
      sM.children.push(writePostsPerDay(writer, data[Y][M].postPerDay, context));
      sM.children.push(writePostsPerHour(writer, data[Y][M].postPerWeekHour, context));
      sM.children.push(writeStatsList(writer, data[Y][M], context));

      sM.value = Object.values(sM.children).reduce((p, v) => p + v.value, 0);
      delete sM.children;

      sY.children.push(sM);
    });

    children.push(sY);
  });

  children.push({ name: "headers", value: headersSize });

  return {
    name: "Monthly",
    value: headersSize,
    children,
  };
}
