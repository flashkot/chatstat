////////////////////////////////////////////////////////////////////////////////
// tests
////////////////////////////////////////////////////////////////////////////////
import test from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";

import { createReader, createWriter } from "./format/binrw.js";
import { LISTS_NAMES, STATS_FIELDS } from "./format/constants.js";
import { createStringsLookup, readBin, writeBin } from "./format/binformat.js";

import {
  readArrayOfInts,
  readArrayOfStrings,
  writeArrayOfInts,
  writeArrayOfStrings,
} from "./format/arrays.js";

import { readBitField, writeBitField } from "./format/bitfield.js";
import { readMonthlyStats, writeMonthlyStats } from "./format/monthstats.js";
import { readPostsPerDay, writePostsPerDay } from "./format/postsperday.js";
import { readPostsPerHour, writePostsPerHour } from "./format/postsperhour.js";
import { readStatsList, writeStatsList } from "./format/statslist.js";
import { readUsersMonthly, writeUsersMonthly } from "./format/usersmonthly.js";
import { readUserList, writeUserList } from "./format/userlist.js";
import { readClouds, writeClouds } from "./format/clouds.js";
import { readUsersPostsPerDay, writeUsersPostsPerDay } from "./format/userspostsperday.js";
import { readUsersTotals, writeUsersTotals } from "./format/userstotals.js";
import { readCloudWordsList, writeCloudWordsList } from "./format/cloudwordstable.js";
import { compareDeep } from "../utils/comparedeep.js";

let testData = JSON.parse(readFileSync("./stats/data_for_tests.json", "utf8"));

test.suite("Primitives writing/reading", () => {
  test("Array of ints", () => {
    let tests = [
      [],
      [0],
      [2 ** 32 - 1],
      [1],
      [2],
      [3],
      [4],
      [5],
      [6],
      [7],
      [8],
      [9],
      [10],
      [11],
      [12],
      [13],
      [14],
      [15],
      [16],
      [3, 3, 23, 14, 35, 53, 4, 1, 135135, 15, 24, 1, 0, 0, 0, 0, 77, 2 ** 53 - 1, 2 ** 40],
    ];

    function doTests(data) {
      let w = createWriter();

      writeArrayOfInts(w, data);

      let r = createReader(w.data);
      let result = readArrayOfInts(r);

      assert.deepStrictEqual(result, data);
      assert.equal(r.getPos(), w.getPos(), "Bytes read == bytes written");
    }

    tests.forEach(doTests);
  });

  test("Array of strings", () => {
    let tests = [
      [],
      ["null"],
      ["a", "a", "a", "B", "a", "a", "u", "😀", "Проверочка!", "And some surrogate pairs here 👇"],
    ];

    function doTests(data) {
      let w = createWriter();

      writeArrayOfStrings(w, data);

      let r = createReader(w.data);
      let result = readArrayOfStrings(r);

      assert.deepStrictEqual(result, data);
      assert.equal(r.getPos(), w.getPos(), "Bytes read == bytes written");
    }

    tests.forEach(doTests);
  });

  test("BitFields", () => {
    let tests = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [256],
      [0, 11, 31, 66],
      [],
      [0],
      [1],
      [2],
      [3],
      [4],
      [5],
      [6],
      [7],
      [8],
      [9],
      [10],
      [11],
      [12],
      [13],
      [14],
      [15],
      [16],
    ];

    function runTest(test) {
      let w = createWriter();
      writeBitField(w, test);

      let r = createReader(w.data);
      let result = readBitField(r);

      assert.deepStrictEqual(result, test);
      assert.equal(r.getPos(), w.getPos(), "Bytes read == bytes written");
    }

    tests.forEach(runTest);
  });
});

test("Posts per day", () => {
  let tests = [{}, { 25: 269, 26: 463, 27: 282, 28: 236, 29: 181, 30: 134 }];

  function runTest(test) {
    let w = createWriter();
    writePostsPerDay(w, test);

    let r = createReader(w.data);
    let result = readPostsPerDay(r);

    assert.deepStrictEqual(result.data, test);
    assert.equal(r.getPos(), w.getPos(), "Bytes read == bytes written");
  }

  tests.forEach(runTest);
});

test("Posts per weekday hours", () => {
  let test = {
    0: {
      0: 2,
      6: 8,
      7: 7,
      8: 5,
      9: 13,
      10: 17,
      11: 11,
      12: 1,
      14: 3,
      15: 10,
      16: 20,
      17: 6,
      18: 14,
      19: 21,
      20: 13,
      21: 34,
      22: 33,
      23: 18,
    },
    1: {
      0: 3,
      4: 1,
      6: 1,
      7: 1,
      8: 8,
      9: 52,
      10: 5,
      11: 2,
      12: 1,
      13: 22,
      14: 40,
      15: 3,
      19: 8,
      20: 6,
      21: 7,
      22: 16,
      23: 5,
    },
    2: {},
    4: { 14: 10, 15: 32, 16: 21, 17: 18, 20: 9, 21: 36, 22: 86, 23: 57 },
    5: {
      0: 18,
      2: 7,
      6: 7,
      7: 1,
      8: 2,
      9: 11,
      10: 21,
      11: 21,
      12: 60,
      13: 155,
      14: 36,
      15: 19,
      16: 4,
      17: 4,
      18: 7,
      19: 15,
      20: 40,
      21: 25,
      22: 9,
      23: 1,
    },
    6: {
      0: 3,
      1: 9,
      2: 2,
      3: 5,
      4: 1,
      5: 1,
      7: 1,
      8: 5,
      9: 8,
      11: 32,
      12: 41,
      13: 14,
      15: 37,
      16: 42,
      17: 9,
      18: 38,
      19: 10,
      20: 1,
      21: 10,
      22: 5,
      23: 8,
    },
  };

  function runTest(test) {
    let w = createWriter();
    writePostsPerHour(w, test);

    let r = createReader(w.data);
    let result = readPostsPerHour(r);

    assert.deepStrictEqual(result.data, test);
    assert.equal(r.getPos(), w.getPos(), "Bytes read == bytes written");
  }

  runTest(test);
});

test("Stats list write/read", () => {
  let context = {
    LISTS_NAMES,
    listsLookup: ["a", "b", "ccc"],
  };

  let test = {
    hashTags: { a: 1, b: 2, ccc: 3 },
    reactions: { ccc: 3, b: 1, a: 500 },
  };

  function runTest(test) {
    let w = createWriter();
    writeStatsList(w, test, context);

    let r = createReader(w.data);
    let result = readStatsList(r, context);

    assert.deepStrictEqual(result.data, test);
    assert.equal(r.getPos(), w.getPos(), "Bytes read == bytes written");
  }

  runTest(test);
});

test("Users List write/read", () => {
  let test = {
    0: { name: "user 1", alias: "@user1", aka: [] },
    1: { name: "", alias: "@user2", aka: [] },
    2: { name: "user 3", aka: [] },
    3: { name: "User 4", alias: "@user4", aka: ["@4user"] },
    4: { name: "user 5" },
  };

  let expect = {
    0: { name: "user 1", alias: "@user1", aka: [] },
    1: { name: "", alias: "@user2", aka: [] },
    2: { name: "user 3", alias: "", aka: [] },
    3: { name: "User 4", alias: "@user4", aka: ["@4user"] },
    4: { name: "user 5", alias: "", aka: [] },
  };

  function runTest(test) {
    let w = createWriter();
    writeUserList(w, test);

    let r = createReader(w.data);
    let result = readUserList(r);

    assert.deepStrictEqual(result.data, expect);
    assert.equal(r.getPos(), w.getPos(), "Bytes read == bytes written");
  }

  runTest(test);
});

test("Monthly users stats", () => {
  let tests = [
    testData.monthly[2022][10].users,
    testData.monthly[2022][11].users,
    testData.monthly[2025][2].users,
  ];
  let context = {
    MAX_USERS_FOR_BITMASK: 15,
    STATS_FIELDS,
    usersCount: Object.keys(testData.users).length,
  };

  function runTest(test) {
    let w = createWriter();
    writeUsersMonthly(w, test, context);

    let r = createReader(w.data);
    let result = readUsersMonthly(r, context);

    assert.deepStrictEqual(result.data, test);
    assert.equal(r.getPos(), w.getPos(), "Bytes read == bytes written");
  }

  tests.forEach(runTest);
});

test("Monthly stats", () => {
  let tests = [testData.monthly];
  let context = {
    MAX_USERS_FOR_BITMASK: 15,
    STATS_FIELDS,
    LISTS_NAMES,
    usersCount: Object.keys(testData.users).length,
    listsLookup: [],
  };

  context.listsLookup = createStringsLookup(testData, context.LISTS_NAMES);

  function runTest(test) {
    let w = createWriter();
    writeMonthlyStats(w, test, context);

    let r = createReader(w.data);
    let result = readMonthlyStats(r, context);

    assert.deepStrictEqual(result.data, test);
    assert.equal(r.getPos(), w.getPos(), "Bytes read == bytes written");
  }

  tests.forEach(runTest);
});

test("Users total posts per day", () => {
  let tests = [
    testData.usersTotal[0].postPerDay,
    testData.usersTotal[10].postPerDay,
    testData.usersTotal[15].postPerDay,
  ];

  function runTestBitField(test) {
    let context = {
      MAX_USERS_FOR_BITMASK: 15,
      STATS_FIELDS,
      usersCount: Object.keys(testData.users).length,
    };

    let w = createWriter();
    writeUsersPostsPerDay(w, test, context);

    let r = createReader(w.data);
    let result = readUsersPostsPerDay(r, context);

    assert.deepStrictEqual(result.data, test);
    assert.equal(r.getPos(), w.getPos(), "Bytes read == bytes written");
  }

  function runTest(test) {
    let context = {
      MAX_USERS_FOR_BITMASK: 70,
      STATS_FIELDS,
      usersCount: Object.keys(testData.users).length,
    };

    let w = createWriter();
    writeUsersPostsPerDay(w, test, context);

    let r = createReader(w.data);
    let result = readUsersPostsPerDay(r, context);

    assert.deepStrictEqual(result.data, test);
    assert.equal(r.getPos(), w.getPos(), "Bytes read == bytes written");
  }

  tests.forEach(runTestBitField);
  tests.forEach(runTest);
});

test("Users total totalStats", () => {
  let tests = [testData.usersTotal];
  let listsLookup = createStringsLookup(testData, LISTS_NAMES);

  function runTestBitField(test) {
    let context = {
      MAX_USERS_FOR_BITMASK: 15,
      STATS_FIELDS,
      LISTS_NAMES,
      usersCount: Object.keys(testData.users).length,
      listsLookup,
      users: testData.users,
    };

    let w = createWriter();
    writeUsersTotals(w, test, context);

    let r = createReader(w.data);
    let result = readUsersTotals(r, context);

    assert.deepStrictEqual(result.data, test);
    assert.equal(r.getPos(), w.getPos(), "Bytes read == bytes written");
  }

  function runTest(test) {
    let context = {
      MAX_USERS_FOR_BITMASK: 70,
      STATS_FIELDS,
      LISTS_NAMES,
      usersCount: Object.keys(testData.users).length,
      listsLookup,
      users: testData.users,
    };

    let w = createWriter();
    writeUsersTotals(w, test, context);

    let r = createReader(w.data);
    let result = readUsersTotals(r, context);

    assert.deepStrictEqual(result.data, test);
    assert.equal(r.getPos(), w.getPos(), "Bytes read == bytes written");
  }

  tests.forEach(runTestBitField);
  tests.forEach(runTest);
});

test("Words Table", () => {
  let tests = [[], [""], ["😀", "test", "проверочка", "123"], ["a", "a", "a", "a", "a", "a", "a"]];

  function runTest(test) {
    let w = createWriter();
    writeCloudWordsList(w, test);

    let r = createReader(w.data);
    let result = readCloudWordsList(r);

    assert.deepStrictEqual(result.data, test);
    assert.equal(r.getPos(), w.getPos(), "Bytes read == bytes written");
  }

  tests.forEach(runTest);
});

test("Words Clouds", () => {
  let tests = [
    {
      users: { 0: testData.wordClouds.users[17] },
      total: testData.wordClouds.users[6],
      months: { "2022-01": testData.wordClouds.users[17] },
    },
  ];
  let context = {
    MAX_USERS_FOR_BITMASK: 15,
    STATS_FIELDS,
    LISTS_NAMES,
    usersCount: Object.keys(testData.users).length,
    listsLookup: [],
    users: testData.users,
  };

  context.listsLookup = createStringsLookup(testData, context.LISTS_NAMES);

  function runTest(test) {
    let w = createWriter();
    writeClouds(w, test, context);

    let r = createReader(w.data);
    let result = readClouds(r, context);

    sortWordClouds(test);
    sortWordClouds(result.data);

    let c = compareDeep(result.data, test, true);
    assert.deepStrictEqual(c, true);
    // assert.deepStrictEqual(result.data, test);
    assert.equal(r.getPos(), w.getPos(), "Bytes read == bytes written");
  }

  tests.forEach(runTest);
});

test("Complete stats", () => {
  let tests = [testData];

  function runTest(test) {
    let encoded = writeBin(test);
    let decoded = readBin(encoded.data);

    sortWordClouds(test.wordClouds);
    sortWordClouds(decoded.data.wordClouds);

    // UGLY: IDK what to do, if something breaks it tries to generate diff of
    // 1MB json and this just hangs, so this how i countered it.
    let c = compareDeep(decoded.data, test, true);
    assert.deepStrictEqual(c, true);
    // assert.deepStrictEqual(decoded.data, test);
  }

  tests.forEach(runTest);
});

const collator = new Intl.Collator("ru", {
  usage: "sort",
  sensetivity: "accent",
  numeric: true,
});

const strCompare = collator.compare;

// Now wordClouds encoder do not preserve order of the words
// this is totally OK, we can accept it
// But `assert` can't! So we sort test and result with this function
function sortWordClouds(data) {
  data.total.sort((a, b) => strCompare(a[0], b[0]));

  for (let m in data.months) {
    data.months[m].sort((a, b) => strCompare(a[0], b[0]));
  }

  for (let u in data.users) {
    data.users[u].sort((a, b) => strCompare(a[0], b[0]));
  }
}
