import { toUnicode as domainToUnicode } from "punycode.js/punycode.es6.js";

const domainMap = {
  "www.youtube.com": "youtube.com",
  "youtu.be": "youtube.com",
  "m.youtube.com": "youtube.com",
};

function stripSubDomain(domain) {
  return domain.match(/([^.]+\.[^.]+)$/)[1];
}

function urlToDomain(str) {
  try {
    if (!/^[a-z]+:\/\//i.test(str)) {
      str = "http://" + str;
    }

    let domain = domainToUnicode(new URL(str).hostname).toLowerCase();

    // too much subdomains on those ones
    if (domain.match(/(wikipedia.org|wiktionary.org|youtube.com|youtu.be)$/)) {
      domain = stripSubDomain(domain);
    }

    return domainMap[domain] ?? domain;
  } catch {
    return str;
  }
}

function sanitizeStr(str) {
  return (
    str
      .replace(/[–—]/gim, "-") // pay attention! those are unicode chars not two dashes!
      // .replace(/[^\-0-9@#\p{L}\p{M}\p{Emoji_Presentation}]+/gimu, " ")
      .replace(/[^\-@#\p{L}\p{M}\p{Emoji_Presentation}]+/gimu, " ")
      .replace(/(\p{Emoji_Presentation})/gimu, " $1 ")
      .replace(/\s+-|-\s+/gim, " ")
      .replace(/\s+/gm, " ")
      .replace(/\uFE0E|\uFE0F/gm, "")
      .toLowerCase()
  );
}

export function textCounts(text) {
  let result = "";
  let types = {};
  let hashTags = {};
  let mentions = {};
  let urls = {};
  let textAsIs = "";

  if (!text) {
    result = "";
    textAsIs = "";
  }

  if (typeof text == "string") {
    result = sanitizeStr(text);
    textAsIs = text;
  }

  if (Array.isArray(text)) {
    result = text.reduce((c, p) => {
      if (p.type == "link") {
        textAsIs += p.text;

        if (!types.link) types.link = 0;
        types.link++;
        p = urlToDomain(p.text);

        if (!urls[p]) urls[p] = 0;
        urls[p]++;

        p = " " + p + " ";
      } else if (p.type == "mention" || p.type == "mention_name") {
        textAsIs += p.text;

        if (!types[p.type]) types[p.type] = 0;

        let mnt = p.user_id ? "user" + p.user_id : p.text;
        if (mnt) {
          if (!mentions[mnt]) mentions[mnt] = 0;
          mentions[mnt]++;
        }

        types[p.type]++;
        p = " " + p.text + " ";
      } else if (p.type == "hashtag") {
        textAsIs += p.text;

        if (!types[p.type]) types[p.type] = 0;
        types[p.type]++;
        p = p.text;

        p = p.toLowerCase();

        if (!hashTags[p]) hashTags[p] = 0;
        hashTags[p]++;
        p = " " + p + " ";
      } else if (typeof p.text == "string") {
        if (!types[p.type]) types[p.type] = 0;
        types[p.type]++;

        if (p.href) {
          let l = urlToDomain(p.href);

          if (!urls[l]) urls[l] = 0;
          urls[l]++;
        }

        textAsIs += p.text;
        p = sanitizeStr(p.text);
      } else {
        textAsIs += p;
        p = sanitizeStr(p);
      }

      return c + p;
    }, "");
  }

  result = result.replace(/^\s+|\s+$/gimu, "");

  let wordsCount = result
    .split(/[^\-@#\p{L}\p{M}\p{Emoji_Presentation}]+/gimu)
    .filter(Boolean).length;

  return {
    result: result,
    types,
    hashTags,
    mentions,
    urls,
    len: textAsIs.length,
    words: wordsCount,
  };
}
