/**
 * Lets user to download data as a file
 *
 * @param {Blob} data Blob with data to be saved
 * @param {String} name Name of the saved file
 */
export function saveFile(data, name) {
  if (!(data instanceof Blob)) {
    throw new Error("Data expected to be a Blob.");
  }

  let a = document.createElement("a");

  a.download = name;
  a.rel = "noopener";
  a.target = "_blank";
  a.href = URL.createObjectURL(data);

  setTimeout(() => URL.revokeObjectURL(a.href), 4e4);

  a.dispatchEvent(new MouseEvent("click"));
}
