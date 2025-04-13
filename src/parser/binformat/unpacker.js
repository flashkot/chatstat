import { setOrCreate } from "../utils/setorcreate.js";
import { createReader } from "./format/binrw.js";

/**
 *
 * @param {Array} data array of bytes with encoded data
 */
export function decode(data) {
  const r = createReader(data);

  // start with format version
  const ver = r.readInt(1);

  if (ver !== 1) {
    throw new Error("Unsuported encoding version: " + ver);
  }

  const result = {
    name: r.readStr(),
    genTime: r.readInt(),
    users: {},
    postsPerHour: [],
    monthlyStats: {},
    wordClouds: {
      total: [],
      months: {},
      users: {},
    },
  };

  // writing users
  const numUsers = r.readInt();

  for (let i = 0; i < numUsers; i++) {
    let uId = r.readInt();
    let name = r.readStr();
    let alias = r.readStr();
    let aka = [];

    let akaLen = r.readInt();

    for (let j = 0; j < akaLen; j++) {
      aka.push(r.readStr());
    }

    result.users[uId] = {
      id: uId,
      name,
    };

    if (alias) {
      result.users[uId].alias = alias;
    }

    if (aka.length) {
      result.users[uId].aka = aka;
    }
  }

  // reading postPerHour
  let pphLen = r.readInt();

  for (let i = 0; i < pphLen; i++) {
    let hour = {
      tDiff: r.readInt(),
      posts: {},
    };

    if (numUsers <= 30) {
      let uMask = r.readInt();

      for (let i = 0; i <= 30; i++) {
        if (uMask & (1 << i)) {
          hour.posts[i] = r.readInt();
        }
      }
    } else {
      let num = r.readInt();

      for (let i = 0; i < num; i++) {
        let uId = r.readInt();
        hour.posts[uId] = r.readInt();
      }
    }

    result.postsPerHour.push(hour);
  }

  // reading monthly stats
  let numCols = r.readInt();
  let cols = [];

  for (let i = 0; i < numCols; i++) {
    cols.push(r.readStr());
  }

  let numMU = r.readInt();

  for (let i = 0; i < numMU; i++) {
    let uId = r.readInt();
    let numStats = r.readInt();

    for (let j = 0; j < numStats; j++) {
      let mId = r.readInt();
      let sY = (mId / 100) | 0;
      let sM = mId % 100;

      cols.forEach((c) => {
        let colVal = r.readInt();

        setOrCreate(result.monthlyStats, sY, sM, uId, c, colVal);
      });
    }
  }

  // now fun part. we will write 5 lists in this order. Names map first, then data
  let listNames = ["forwardsFrom", "reactions", "hashTags", "mentions", "sites"];

  listNames.forEach((list) => {
    let listMap = [];
    let lmLen = r.readInt();

    for (let i = 0; i < lmLen; i++) {
      listMap.push(r.readStr());
    }

    let uLen = r.readInt();
    for (let i = 0; i < uLen; i++) {
      let uId = r.readInt();
      let numStats = r.readInt();

      for (let j = 0; j < numStats; j++) {
        let mId = r.readInt();
        let sY = (mId / 100) | 0;
        let sM = mId % 100;

        setOrCreate(result.monthlyStats, sY, sM, uId, list, {});

        let iNum = r.readInt();
        for (let k = 0; k < iNum; k++) {
          let val = listMap[r.readInt()];
          setOrCreate(result.monthlyStats, sY, sM, uId, list, val, r.readInt());
        }
      }
    }
  });

  // reading clouds data here
  let cMap = [];
  let cmLen = r.readInt();

  for (let i = 0; i < cmLen; i++) {
    cMap.push(r.readStr());
  }

  function readCloudItem() {
    return [
      cMap[r.readInt()],
      r.readInt(),
      r.readInt(),
      r.readInt() * 24 - 60,
      r.readInt() - 14520 / 2,
      r.readInt() - 900 / 2,
    ];
  }

  let tNum = r.readInt();
  for (let i = 0; i < tNum; i++) {
    result.wordClouds.total.push(readCloudItem());
  }

  let mNum = r.readInt();
  for (let i = 0; i < mNum; i++) {
    let mId = r.readInt();
    let sY = (mId / 100) | 0;
    let sM = String(mId % 100).padStart(2, "0");

    let cloud = [];
    let cLen = r.readInt();
    for (let i = 0; i < cLen; i++) {
      cloud.push(readCloudItem());
    }

    result.wordClouds.months[sY + "-" + sM] = cloud;
  }

  let uNum = r.readInt();
  for (let i = 0; i < uNum; i++) {
    let uId = r.readInt();

    let cloud = [];
    let cLen = r.readInt();
    for (let i = 0; i < cLen; i++) {
      cloud.push(readCloudItem());
    }

    result.wordClouds.users[uId] = cloud;
  }

  // OMG! This is it? IDK how many hours i will pour on debugging this... Lets see.
  // And there is a chance that this will be outperformed by plain json compressed with deflate
  return result;
}
