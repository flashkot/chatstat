import { readBitField, writeBitField } from "./bitfield.js";
import { readPostsPerHour, writePostsPerHour } from "./postsperhour.js";
import { readStatsList, writeStatsList } from "./statslist.js";
import { readUsersPostsPerDay, writeUsersPostsPerDay } from "./userspostsperday.js";

export function readUsersTotals(reader, context) {
  let result = {};

  let children = [];
  let headersSize = 0;

  function readUser(U) {
    let user = {};

    let sU = {
      name: context.users[U].name,
      children: [],
    };
    let ret;

    ret = readUsersPostsPerDay(reader, context);
    user.postPerDay = ret.data;
    sU.children.push(ret.treeMap);

    ret = readPostsPerHour(reader, context);
    user.postPerWeekHour = ret.data;
    sU.children.push(ret.treeMap);

    ret = readStatsList(reader, context);
    for (let list in ret.data) {
      user[list] = ret.data[list];
    }
    sU.children.push(ret.treeMap);

    sU.value = Object.values(sU.children).reduce((p, v) => p + v.value, 0);
    delete sU.children;

    children.push(sU);

    return user;
  }

  if (context.usersCount > context.MAX_USERS_FOR_BITMASK) {
    let numUsers = reader.readInt();
    headersSize += reader.bytesRead();

    for (let i = 0; i < numUsers; i++) {
      let userId = reader.readInt();
      headersSize += reader.bytesRead();

      let user = readUser(userId);
      result[userId] = user;
    }
  } else {
    let userIds = readBitField(reader);
    headersSize += reader.bytesRead();

    userIds.forEach((i) => {
      let user = readUser(i);
      result[i] = user;
    });
  }

  return {
    data: result,
    treeMap: {
      name: "Users stats",
      value: headersSize,
      children,
    },
  };
}

export function writeUsersTotals(writer, data, context) {
  let children = [];
  let headersSize = 0;

  let users = Object.keys(data).map(Number);
  users.sort((a, b) => a - b);

  if (context.usersCount > context.MAX_USERS_FOR_BITMASK) {
    writer.writeInt(users.length);
  } else {
    writeBitField(writer, users);
  }
  headersSize += writer.bytesWritten();

  users.forEach((U) => {
    if (context.usersCount > context.MAX_USERS_FOR_BITMASK) {
      writer.writeInt(U);
      headersSize += writer.bytesWritten();
    }

    let sU = {
      name: "User " + context.users[U],
      children: [],
    };

    sU.children.push(writeUsersPostsPerDay(writer, data[U].postPerDay, context));
    sU.children.push(writePostsPerHour(writer, data[U].postPerWeekHour, context));
    sU.children.push(writeStatsList(writer, data[U], context));

    sU.value = Object.values(sU.children).reduce((p, v) => p + v.value, 0);
    delete sU.children;

    children.push(sU);
  });

  children.push({ name: "headers", value: headersSize });

  return {
    name: "Users stats",
    value: headersSize,
    children,
  };
}
