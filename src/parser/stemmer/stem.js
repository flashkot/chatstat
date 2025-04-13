import { newStemmer } from "./snowball.en-ru.es6.js";
import { filterEn, filterRu } from "./stopwwords.js";

const stemmerRu = new newStemmer("Russian");
const stemmerEn = new newStemmer("English");

export function stemmRuEn(word) {
  if (!word || word.length == 1) {
    return "";
  }

  let stem;
  if (/[a-z]/.test(word)) {
    stem = filterEn(stemmerEn.stem(word));
  } else {
    stem = filterRu(stemmerRu.stem(word.replaceAll("ё", "е")));
  }

  return stem;
}

export function stemmString(string) {
  return string.split(/\s+/).map(stemmRuEn).filter(Boolean);
}

export function stemmWordsArray(words) {
  return words.map((w) => ({ w: w, s: stemmRuEn(w) })).filter((w) => Boolean(w.s));
}
