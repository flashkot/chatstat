const { subtle } = globalThis.crypto;

export function hashData(data, algo = "SHA-256") {
  if (typeof data == "string") {
    data = new TextEncoder().encode(data);
  }

  return subtle
    .digest(algo, data)
    .then((h) =>
      new Uint8Array(h).reduce((s, b) => s + (b < 16 ? "0" + b.toString(16) : b.toString(16)), ""),
    );
}
