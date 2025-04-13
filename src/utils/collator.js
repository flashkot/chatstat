export const collator = new Intl.Collator("ru", {
  usage: "sort",
  sensetivity: "accent",
  numeric: true,
});

export const strCompare = collator.compare;
