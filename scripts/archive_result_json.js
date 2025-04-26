import { readFileSync, writeFileSync } from "node:fs";

let inData = JSON.parse(readFileSync(process.argv[2], "utf8"));
let outData = {
  name: inData.name,
  type: inData.type,
  id: inData.id,
  messages: [],
};

console.log("Chat name: " + outData.name);
console.log("Messages count: " + inData.messages.length.toLocaleString());

let dateStr = new Date(inData.messages.at(-1).date_unixtime * 1000).toISOString().substring(0, 10);

console.log("Last message unix date: " + dateStr);

function filterFields(inMsg) {
  let outMsg = {};

  for (let f in inMsg) {
    if (f == "text") {
      if (!inMsg.text_entities) {
        outMsg[f] = inMsg[f];
      }
    } else {
      outMsg[f] = inMsg[f];
    }
  }
  return outMsg;
}

outData.messages = inData.messages.map(filterFields);

writeFileSync(
  process.argv[2].replace(/\.json$/, "") + "." + dateStr + ".cllean.json",
  JSON.stringify(outData),
);
