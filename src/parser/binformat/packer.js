import { setOrCreate } from "../utils/setorcreate.js";
import { createWriter } from "./format/binrw.js";

/**
 * ```js
 * data ={
 *   name: "ChatName",
 *   genTime: 123456789, // unix timestamp in seconds
 *   users: {},          // info for each user
 *   postsPerHour: [],   // Array with data about posts on each hour
 *   monthlyStats: {},   // Nested objects with stats for each month
 *   wordClouds: {},     // Nested objects with clouds rendering params
 * }
 * ```
 * @param {Object} data
 */
export function encode(data) {
  const w = createWriter();

  // start with format version
  w.writeInt(1);

  // info about export
  w.writeStr(data.name);
  w.writeInt(data.genTime);

  // writing users
  let users = Object.values(data.users);
  const numUsers = users.length;

  w.writeInt(numUsers);

  users.forEach((u) => {
    w.writeInt(u.id);
    w.writeStr(u.name ?? "");
    w.writeStr(u.alias ?? "");

    if (!u.aka || u.aka.length === 0) {
      w.writeInt(0);
    } else {
      w.writeInt(u.aka.length);
      u.aka.forEach((a) => w.writeStr(a));
    }
  });

  // writing post per hour data
  w.writeInt(data.postsPerHour.length);

  data.postsPerHour.forEach((hourData) => {
    w.writeInt(hourData.tDiff);

    // since we already know how much users in the chat, just make decission on that info
    // I'm lazy to make proper BitField without length limit, so we do it this way instead
    if (numUsers <= 30) {
      let uMask = 0;
      let posts = [];

      for (let id in hourData.posts) {
        uMask += 1 << Number(id);
        posts.push(hourData.posts[id]);
      }

      w.writeInt(uMask);

      posts.forEach((n) => w.writeInt(n));
    } else {
      w.writeInt(Object.keys(hourData.posts).length);

      for (let id in hourData.posts) {
        w.writeInt(Number(id));
        w.writeInt(hourData.posts[id]);
      }
    }
  });

  // writing monthly stats

  // we will reverse data to be user->months. And also flatten months.
  let userStats = {};
  let sampleStats;

  let listStas = {
    forwardsFrom: {},
    reactions: {},
    hashTags: {},
    mentions: {},
    sites: {},
  };

  for (let sY in data.monthlyStats) {
    for (let sM in data.monthlyStats[sY]) {
      for (let sU in data.monthlyStats[sY][sM]) {
        if (!userStats[sU]) userStats[sU] = {};
        let mData = data.monthlyStats[sY][sM][sU];

        let monthId = Number(sY + sM.padStart(2, 0));
        userStats[sU][monthId] = mData;

        Object.keys(mData.forwardsFrom).forEach((f) => setOrCreate(listStas, "forwardsFrom", f, 1));
        Object.keys(mData.reactions).forEach((r) => setOrCreate(listStas, "reactions", r, 1));
        Object.keys(mData.hashTags).forEach((h) => setOrCreate(listStas, "hashTags", h, 1));
        Object.keys(mData.mentions).forEach((m) => setOrCreate(listStas, "mentions", m, 1));
        Object.keys(mData.sites).forEach((s) => setOrCreate(listStas, "sites", s, 1));

        if (!sampleStats) {
          // idk how to get that nicely otherwise. so we will check it here every loop
          sampleStats = mData;
        }
      }
    }
  }

  // Here we eill write numeric stats only. And we start with list of prop names
  let columns = Object.entries(sampleStats)
    .filter((e) => typeof e[1] == "number")
    .map((e) => e[0]);

  w.writeInt(columns.length);
  columns.forEach((c) => w.writeStr(c));

  // now values themselves
  w.writeInt(Object.keys(userStats).length);
  for (let uId in userStats) {
    w.writeInt(Number(uId));

    w.writeInt(Number(Object.keys(userStats[uId]).length));
    for (let mId in userStats[uId]) {
      w.writeInt(Number(mId));

      // we know list of props, so no need for writing legth here
      columns.forEach((c) => w.writeInt(userStats[uId][mId][c]));
    }
  }

  // now fun part. we will write 5 lists in this order. Names map first, then data
  let listNames = ["forwardsFrom", "reactions", "hashTags", "mentions", "sites"];

  listNames.forEach((list) => {
    let listMap = Object.entries(listStas[list])
      .sort((a, b) => b[1] - a[1])
      .map((a) => a[0]);

    w.writeInt(Object.keys(listMap).length);
    listMap.forEach((v) => w.writeStr(v));

    w.writeInt(Object.keys(userStats).length);
    for (let uId in userStats) {
      w.writeInt(Number(uId));

      w.writeInt(Object.keys(userStats[uId]).length);
      for (let mId in userStats[uId]) {
        w.writeInt(Number(mId));

        let listItems = Object.entries(userStats[uId][mId][list]);

        w.writeInt(listItems.length);
        listItems.forEach((i) => {
          w.writeInt(listMap.indexOf(i[0]));
          w.writeInt(i[1]);
        });
      }
    }
  });

  // final big chunk - Word Clouds
  let cloudItems = {};

  data.wordClouds.total.forEach((w) => setOrCreate(cloudItems, w[0], 1));

  for (let mId in data.wordClouds.months) {
    data.wordClouds.months[mId].forEach((w) => setOrCreate(cloudItems, w[0], 1));
  }

  for (let uId in data.wordClouds.users) {
    data.wordClouds.users[uId].forEach((w) => setOrCreate(cloudItems, w[0], 1));
  }

  let cloudMap = Object.entries(cloudItems)
    .sort((a, b) => b[1] - a[1])
    .map((a) => a[0]);

  w.writeInt(cloudMap.length);
  cloudMap.forEach((v) => w.writeStr(v));

  function writeCloudItem(e) {
    w.writeInt(cloudMap.indexOf(e[0]));
    w.writeInt(e[1]);
    w.writeInt(e[2]);
    w.writeInt((e[3] + 60) / 24);
    w.writeInt(e[4] + 14520 / 2);
    w.writeInt(e[5] + 900 / 2);
  }

  w.writeInt(data.wordClouds.total.length);
  data.wordClouds.total.forEach(writeCloudItem);

  w.writeInt(Object.keys(data.wordClouds.months).length);
  for (let mId in data.wordClouds.months) {
    w.writeInt(Number(mId.replace(/[^0-9]/g, "")));

    w.writeInt(data.wordClouds.months[mId].length);
    data.wordClouds.months[mId].forEach(writeCloudItem);
  }

  w.writeInt(Object.keys(data.wordClouds.users).length);
  for (let uId in data.wordClouds.users) {
    w.writeInt(Number(uId));

    w.writeInt(data.wordClouds.users[uId].length);
    data.wordClouds.users[uId].forEach(writeCloudItem);
  }

  // OMG! This is it? IDK how many hours i will pour on debugging this... Lets see.
  // And there is a chance that this will be outperformed by plain json compressed with deflate
  return new Uint8Array(w.data);
}
