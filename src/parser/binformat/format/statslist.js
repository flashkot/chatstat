import { readBitField, writeBitField } from "./bitfield.js";

export function readStatsList(reader, context) {
  const result = {};
  let listIds = readBitField(reader);

  listIds.forEach((listId) => {
    let list = context.LISTS_NAMES[listId];

    let listSize = reader.readInt();
    let listItems = {};

    for (let i = 0; i < listSize; i++) {
      listItems[context.listsLookup[reader.readInt()]] = reader.readInt();
    }

    result[list] = listItems;
  });

  return {
    data: result,
    treeMap: {
      name: "Full stats lists",
      value: reader.bytesRead(),
    },
  };
}

export function writeStatsList(writer, data, context) {
  let listsIds = [];

  context.LISTS_NAMES.forEach((list, i) => {
    if (data[list]) {
      listsIds.push(i);
    }
  });

  listsIds.sort((a, b) => a - b);

  writeBitField(writer, listsIds);

  listsIds.forEach((listId) => {
    let list = context.LISTS_NAMES[listId];
    let items = Object.entries(data[list]);

    writer.writeInt(items.length);

    items.forEach((i) => {
      writer.writeInt(context.listsLookup.indexOf(i[0]));
      writer.writeInt(i[1]);
    });
  });

  return {
    name: "Full stats lists",
    value: writer.bytesWritten(),
  };
}
