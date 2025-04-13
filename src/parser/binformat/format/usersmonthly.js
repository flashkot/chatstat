import { readBitField, writeBitField } from "./bitfield.js";

export function readUsersMonthly(reader, context) {
  const result = {};

  if (context.usersCount > context.MAX_USERS_FOR_BITMASK) {
    let numUsers = reader.readInt();

    for (let i = 0; i < numUsers; i++) {
      let user = {};
      let userId = reader.readInt();

      context.STATS_FIELDS.forEach((F) => (user[F] = reader.readInt()));
      result[userId] = user;
    }
  } else {
    let userIds = readBitField(reader);

    userIds.forEach((i) => {
      let user = {};
      context.STATS_FIELDS.forEach((F) => (user[F] = reader.readInt()));
      result[i] = user;
    });
  }

  return {
    data: result,
    treeMap: {
      name: "Users monthly stats",
      value: reader.bytesRead(),
    },
  };
}

export function writeUsersMonthly(writer, data, context) {
  let users = Object.keys(data).map(Number);
  users.sort((a, b) => a - b);

  if (context.usersCount > context.MAX_USERS_FOR_BITMASK) {
    writer.writeInt(users.length);
  } else {
    writeBitField(writer, users);
  }

  users.forEach((U) => {
    if (context.usersCount > context.MAX_USERS_FOR_BITMASK) {
      writer.writeInt(U);
    }

    context.STATS_FIELDS.forEach((F) => writer.writeInt(data[U][F]));
  });

  return {
    name: "Users monthly stats",
    value: writer.bytesWritten(),
  };
}
