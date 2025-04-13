import { readCloudWordsList, writeCloudWordsList } from "./cloudwordstable.js";

export function readClouds(reader, context) {
  let children = [];

  let result = {
    total: [],
    months: {},
    users: {},
  };

  let ret = readCloudWordsList(reader);
  children.push(ret.treeMap);
  let wLookUp = ret.data;

  function readWords(num) {
    let prev = 0;
    let words = [];

    for (let i = 0; i < num; i++) {
      words.push([
        wLookUp[reader.readInt()],
        reader.readInt(),
        reader.readInt(),
        reader.readInt(),
        (prev += reader.readInt()),
      ]);
    }

    return words;
  }

  let numT = reader.readInt();
  result.total = readWords(numT);

  children.push({ name: "Total cloud", value: reader.bytesRead() });

  let subChilds = [];

  let numM = reader.readInt();
  for (let i = 0; i < numM; i++) {
    let monthId = String(reader.readInt());
    let monthIdPlus =
      monthId[0] +
      monthId[1] +
      monthId[2] +
      monthId[3] +
      "-" +
      String(Number(monthId[4] + monthId[5]) + 1).padStart(2, "0");
    monthId = monthId[0] + monthId[1] + monthId[2] + monthId[3] + "-" + monthId[4] + monthId[5];

    result.months[monthId] = [];

    let numW = reader.readInt();
    result.months[monthId] = readWords(numW);

    subChilds.push({ name: monthIdPlus + " cloud", value: reader.bytesRead() });
  }
  children.push({ name: "Months clouds", children: subChilds });
  subChilds = [];

  let numU = reader.readInt();
  for (let i = 0; i < numU; i++) {
    let userId = reader.readInt();
    result.users[userId] = [];

    let numW = reader.readInt();
    result.users[userId] = readWords(numW);

    subChilds.push({ name: context.users[userId].name + " cloud", value: reader.bytesRead() });
  }
  children.push({ name: "Userss clouds", children: subChilds });

  return {
    data: result,
    treeMap: {
      name: "Words Clouds",
      children,
    },
  };
}

export function writeClouds(writer, data, context) {
  let children = [];

  let wLookUp = createCloudWordsLookup(data);
  children.push(writeCloudWordsList(writer, wLookUp));

  function writeWords(list) {
    let newList = list
      .map((word) => [wLookUp.indexOf(word[0]), word[1], word[2], word[3], word[4]])
      .sort((a, b) => a[4] - b[4]);

    let prev = 0;

    newList.forEach((word) => {
      writer.writeInt(word[0]);
      writer.writeInt(word[1]);
      writer.writeInt(word[2]);
      writer.writeInt(word[3]);
      writer.writeInt(word[4] - prev);
      prev = word[4];
    });
  }

  writer.writeInt(data.total.length);
  writeWords(data.total);
  children.push({ name: "Total cloud", value: writer.bytesWritten() });

  let subChilds = [];

  writer.writeInt(Object.keys(data.months).length);
  for (let m in data.months) {
    writer.writeInt(Number(m.replace(/[^0-9]/g, "")));
    writer.writeInt(data.months[m].length);
    writeWords(data.months[m]);
    subChilds.push({ name: m + " cloud", value: writer.bytesWritten() });
  }
  children.push({ name: "Months clouds", children: subChilds });
  subChilds = [];

  writer.writeInt(Object.keys(data.users).length);
  for (let u in data.users) {
    writer.writeInt(Number(u));
    writer.writeInt(data.users[u].length);
    writeWords(data.users[u]);
    subChilds.push({ name: context.users[u].name + " cloud", value: writer.bytesWritten() });
  }
  children.push({ name: "Months clouds", children: subChilds });

  return {
    name: "Words Clouds",
    children,
  };
}

function createCloudWordsLookup(data) {
  let lookUp = {};

  function save(w) {
    if (lookUp[w[0]]) lookUp[w[0]] = 0;
    lookUp[w[0]]++;
  }

  data.total.forEach(save);

  for (let m in data.months) {
    data.months[m].forEach(save);
  }

  for (let u in data.users) {
    data.users[u].forEach(save);
  }

  return Object.entries(lookUp)
    .sort((a, b) => b[1] - a[1])
    .map((w) => w[0]);
}
