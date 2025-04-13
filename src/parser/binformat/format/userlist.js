import { readArrayOfStrings, writeArrayOfStrings } from "./arrays.js";

export function readUserList(reader) {
  const result = {};
  const len = reader.readInt();

  for (let i = 0; i < len; i++) {
    let user = {};
    let uId = reader.readInt();
    result[uId] = user;

    user.name = reader.readStr();
    user.alias = reader.readStr();
    user.aka = readArrayOfStrings(reader);
  }

  return {
    data: result,
    treeMap: {
      name: "userlist",
      value: reader.bytesRead(),
    },
  };
}

export function writeUserList(writer, data) {
  writer.writeInt(Object.keys(data).length);

  for (let uId in data) {
    let user = data[uId];

    writer.writeInt(uId);
    writer.writeStr(user.name ?? "");
    writer.writeStr(user.alias ?? "");
    writeArrayOfStrings(writer, user.aka ?? []);
  }

  return {
    name: "userlist",
    value: writer.bytesWritten(),
  };
}
