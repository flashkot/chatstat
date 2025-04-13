import { FORMAT_VERSION, LISTS_NAMES, MAX_USERS_FOR_BITMASK, STATS_FIELDS } from "./constants.js";
import { createReader, createWriter } from "./binrw.js";
import { readArrayOfStrings, writeArrayOfStrings } from "./arrays.js";
import { readStatsList, writeStatsList } from "./statslist.js";
import { readUserList, writeUserList } from "./userlist.js";
import { readMonthlyStats, writeMonthlyStats } from "./monthstats.js";
import { readUsersTotals, writeUsersTotals } from "./userstotals.js";
import { readClouds, writeClouds } from "./clouds.js";

export function readBin(data) {
  let result = {};
  let reader = createReader(data);

  let context = {
    data,
    reader,
    LISTS_NAMES,
    STATS_FIELDS,
    MAX_USERS_FOR_BITMASK,
    usersCount: 0,
    listsLookup: [],
  };

  let treeMap = {
    name: "bin",
    value: 0,
    children: [],
  };

  // format version
  let ver = reader.readInt();
  if (FORMAT_VERSION != ver) {
    throw new Error(`Unsuported format version. Expected ${FORMAT_VERSION} got ${ver}`);
  }

  result.name = reader.readStr(data.name);
  result.genTime = reader.readInt(data.genTime);

  treeMap.value = reader.bytesRead();

  let ret;

  ret = readUserList(reader, context);
  result.users = ret.data;
  context.users = ret.data;
  treeMap.children.push(ret.treeMap);

  context.usersCount = Object.keys(result.users).length;
  context.listsLookup = readArrayOfStrings(reader);

  treeMap.children.push({
    name: "Look up table for lists",
    value: reader.bytesRead(),
  });

  ret = readStatsList(reader, context);
  result.total = ret.data;
  treeMap.children.push(ret.treeMap);

  ret = readMonthlyStats(reader, context);
  result.monthly = ret.data;
  treeMap.children.push(ret.treeMap);

  ret = readUsersTotals(reader, context);
  result.usersTotal = ret.data;
  treeMap.children.push(ret.treeMap);

  ret = readClouds(reader, context);
  result.wordClouds = ret.data;
  treeMap.children.push(ret.treeMap);

  return {
    data: result,
    treeMap,
  };
}

export function writeBin(data) {
  let writer = createWriter();

  let context = {
    data,
    writer,
    LISTS_NAMES,
    STATS_FIELDS,
    MAX_USERS_FOR_BITMASK,
    usersCount: Object.keys(data.users).length,
    listsLookup: [],
  };

  let treeMap = {
    name: "bin",
    value: 0,
    children: [],
  };

  // format version
  writer.writeInt(FORMAT_VERSION);

  writer.writeStr(data.name);
  writer.writeInt(data.genTime);

  treeMap.value = writer.bytesWritten();

  context.users = data.users;
  treeMap.children.push(writeUserList(writer, data.users, context));

  context.listsLookup = createStringsLookup(data, context.LISTS_NAMES);

  writeArrayOfStrings(writer, context.listsLookup);
  treeMap.children.push({
    name: "Look up table for lists",
    value: writer.bytesWritten(),
  });

  treeMap.children.push(writeStatsList(writer, data.total, context));
  treeMap.children.push(writeMonthlyStats(writer, data.monthly, context));
  treeMap.children.push(writeUsersTotals(writer, data.usersTotal, context));
  treeMap.children.push(writeClouds(writer, data.wordClouds, context));

  return {
    data: new Uint8Array(writer.data),
    treeMap,
  };
}

export function createStringsLookup(data, lists) {
  let lookUp = {};

  function save(w, v) {
    if (lookUp[w]) lookUp[w] = 0;
    lookUp[w] += v;
  }

  lists.forEach((list) => {
    if (data.total[list]) {
      for (let i in data.total[list]) {
        save(i, data.total[list][i]);
      }
    }

    for (let u in data.usersTotal) {
      if (data.usersTotal[u][list]) {
        for (let i in data.usersTotal[u][list]) {
          save(i, data.usersTotal[u][list][i]);
        }
      }
    }

    for (let Y in data.monthly) {
      for (let M in data.monthly[Y]) {
        if (data.monthly[Y][M][list]) {
          for (let i in data.monthly[Y][M][list]) {
            save(i, data.monthly[Y][M][list][i]);
          }
        }
      }
    }
  });

  return Object.entries(lookUp)
    .sort((a, b) => b[1] - a[1])
    .map((w) => w[0]);
}
