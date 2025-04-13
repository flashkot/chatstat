export function readArrayOfInts(reader) {
  const result = [];
  const len = reader.readInt();

  for (let i = 0; i < len; i++) {
    result.push(reader.readInt());
  }

  return result;
}

export function writeArrayOfInts(writer, context) {
  if (process.env.NODE_ENV != "production") {
    context.forEach((e) => {
      if (typeof e != "number") {
        throw new Error("Array must only contain numbers.");
      }
    });
  }

  writer.writeInt(context.length);

  context.forEach((e) => writer.writeInt(e));
}

export function readArrayOfStrings(reader) {
  const result = [];
  const len = reader.readInt();

  for (let i = 0; i < len; i++) {
    result.push(reader.readStr());
  }

  return result;
}

export function writeArrayOfStrings(writer, context) {
  if (process.env.NODE_ENV != "production") {
    context.forEach((e) => {
      if (typeof e != "string") {
        throw new Error("Array must only contain strings.");
      }
    });
  }

  writer.writeInt(context.length);

  context.forEach((e) => writer.writeStr(e));
}
