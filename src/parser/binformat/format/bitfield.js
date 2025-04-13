export function readBitField(reader) {
  const result = [];

  let bitfiled = [];
  let byte = reader.readByte();

  while (byte > 127) {
    bitfiled.push(byte - 128);
    byte = reader.readByte();
  }

  bitfiled.push(byte);

  for (let pos in bitfiled) {
    let part = bitfiled[pos];

    for (let bit = 0; bit < 7; bit++) {
      if (part & (1 << bit)) {
        result.push(7 * pos + bit);
      }
    }
  }

  return result;
}

export function writeBitField(writer, context) {
  if (process.env.NODE_ENV != "production") {
    context.forEach((e) => {
      if (typeof e != "number") {
        throw new Error("Bitfield array must only contain numbers.");
      }

      let test = new Set(context);

      if (test.size !== context.length) {
        throw new Error("Bitfield array must contain unique numbers.");
      }

      test = [...context];
      test.sort((a, b) => a - b);

      context.forEach((a, i) => {
        if (a !== test[i]) {
          throw new Error("Bitfield array must be ascending sorted.");
        }
      });
    });
  }

  let bitfield = [0];

  context.forEach((b) => {
    let pos = (b / 7) | 0;

    while (pos + 1 > bitfield.length) {
      bitfield.push(0);
    }

    let bitPosValue = 1 << b % 7;
    bitfield[pos] += bitPosValue;
  });

  for (let i = 0; i < bitfield.length - 1; i++) {
    writer.writeByte(bitfield[i] + 128);
  }

  writer.writeByte(bitfield.at(-1));
}
