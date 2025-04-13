import { WordsStats } from "../cloud/statsparser.js";
import { transfromExport } from "../exportreader/parser.js";
import { stemmRuEn } from "../stemmer/stem.js";
import { textCounts } from "../stemmer/textparser.js";
import { setOrCreate as _set } from "../utils/setorcreate.js";

function creatStatsObj() {
  return {
    messages: 0,

    bustle: 0,

    texts: 0,
    symbols: 0,
    words: 0,

    replies: 0,
    receivedReplies: 0,
    forwards: 0,
    // forwardsFrom: {},
    media: 0,
    edits: 0,

    // files: 0,
    images: 0,
    videos: 0,
    audios: 0,
    otherFiles: 0,
    // totalFileSize: 0,
    photoFileSize: 0,
    audioFileSize: 0,
    videoFilesize: 0,
    otherFileSize: 0,

    megapixels: 0,
    video_seconds: 0,
    audio_seconds: 0,
    stickers: 0,

    reactionsCount: 0,
    // reactions: {},

    hashTagsCount: 0,
    // hashTags: {},

    mentionsCount: 0,
    // mentions: {},

    sitesCount: 0,
    // sites: {},

    // wordsCloud: {},
  };
}

const COUNTED_STATS = [
  "stickers",
  "images",
  "photoFileSize",
  "megapixels",
  "videos",
  "videoFilesize",
  "video_seconds",
  "audios",
  "audioFileSize",
  "audio_seconds",
  "otherFiles",
  "otherFileSize",
];

function sortAndTrimLists(stats, limit = 10) {
  let lists = ["reactions", "forwardsFrom", "mentions", "sites", "hashTags"];

  lists.forEach((list) => {
    if (stats[list]) {
      stats[list] = Object.fromEntries(
        Object.entries(stats[list])
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit),
      );
    }
  });
}

function fixMention(userList, mention) {
  let list = Object.values(userList);
  let check;

  check = list.find((u) => u.aka?.includes(mention.toLowerCase()));
  if (check) return check.alias ? check.alias : check.name;

  check = list.find((u) => u.alias?.toLowerCase() == mention.toLowerCase());
  if (check) return check.alias;

  check = list.find((u) => u.tId.toLowerCase() == mention.toLowerCase());
  if (check) return check.alias ? check.alias : check.name;

  return "";
}

/**
 * Function for generating statistics from telegram chat export
 *
 * conf = {
 *  users: {},
 *  includeLastMonth: false
 * }
 *
 * @param {*} data parsed JSON from telegram chat export
 * @param {*} conf object with users obj
 * @returns {Object} object with statistics gathered from messages
 */
export function generateStats(data, conf = {}) {
  let { users, messages, replyToNowhere, messagesById } = transfromExport(data.messages);

  let wordsStats = new WordsStats();

  let total = {};
  let monthly = {};
  let usersTotal = {};

  let usersIds = Object.fromEntries(
    Object.values(users)
      .sort((a, b) => b.messages - a.messages)
      .map((u, i) => [u.tId, i]),
  );

  for (let u in usersIds) {
    users[u].id = usersIds[u];
    users[u].alias = "";
    users[u].aka = [];

    if (conf?.users?.[u]) {
      users[u].name = conf.users[u].name ?? users[u].name;
      users[u].alias = conf.users[u].alias ?? users[u].alias;
      users[u].aka = conf.users[u].aka ?? users[u].aka;
    }
  }

  if (conf.ignoreUnknownUsers && conf.users) {
    usersIds = Object.fromEntries(
      Object.entries(usersIds).filter((u) => Boolean(conf.users[u[0]])),
    );
  }

  let skippedUnknown = 0;

  const lastMsgDate = new Date(messages.at(-1).date_unixtime * 1000);
  const stopTs =
    (new Date(lastMsgDate.getFullYear(), lastMsgDate.getMonth(), 1).getTime() / 1000) | 0;

  for (let msg of messages) {
    if (!conf.includeLastMonth && stopTs <= msg.date_unixtime) {
      break;
    }

    if (msg.from_id) {
      if (!Object.hasOwn(usersIds, msg.from_id)) {
        skippedUnknown++;
        continue;
      }

      let uId = usersIds[msg.from_id];
      msg._uId = uId;

      // counting users monthly stats
      let mDate = new Date(msg.date_unixtime * 1000);
      let mY = mDate.getFullYear();
      let mM = mDate.getMonth();
      let mD = mDate.getDate();
      let mW = (mDate.getDay() + 6) % 7;
      let mH = mDate.getHours();

      msg._date = { mY, mM, mD, mW, mH };

      _set(monthly, mY, mM, "users", uId, creatStatsObj());

      let stats = monthly[mY][mM].users[uId];
      let mStats = monthly[mY][mM];

      _set(monthly, mY, mM, "postPerDay", mD, 1);
      _set(monthly, mY, mM, "postPerWeekHour", mW, mH, 1);

      // _set(total, "postPerDay", mY, mM, mD, 1);
      // _set(total, "postPerWeekHour", mW, mH, 1);
      _set(usersTotal, uId, "postPerDay", mY, mM, mD, 1);
      _set(usersTotal, uId, "postPerWeekHour", mW, mH, 1);

      if (msg.forwarded_from || msg.via_bot) {
        _set(stats, "forwards", 1);

        _set(mStats, "forwardsFrom", msg.forwarded_from, 1);
        _set(total, "forwardsFrom", msg.forwarded_from, 1);
        _set(usersTotal, uId, "forwardsFrom", msg.forwarded_from, 1);
      } else {
        COUNTED_STATS.forEach((prop) => {
          _set(stats, prop, msg[prop] ?? 0);
        });

        _set(stats, "messages", 1);
        _set(stats, "replies", msg.reply_to_message_id ? 1 : 0);
        _set(stats, "receivedReplies", msg.replies?.length ?? 0);

        if (msg.edited_unixtime) {
          _set(stats, "edits", 1);
        }

        if (msg.images || msg.videos || msg.audios) {
          _set(stats, "media", 1);
        }

        if (msg.reactions) {
          msg.reactionsCount = 0;
          for (let r in msg.reactions) {
            _set(stats, "reactionsCount", msg.reactions[r]);
            msg.reactionsCount += msg.reactions[r];

            _set(mStats, "reactions", r, msg.reactions[r]);
            _set(total, "reactions", r, msg.reactions[r]);
            _set(usersTotal, uId, "reactions", r, msg.reactions[r]);
          }
        }

        if (msg.text_entities) {
          let tc = textCounts(msg.text_entities);

          _set(stats, "symbols", tc.len);
          _set(stats, "words", tc.words);

          if (tc.len > 0) {
            _set(stats, "texts", 1);

            let monthId = mY + "-" + String(mM).padStart(2, "0");

            tc.result.split(/\s+/).forEach((w) => {
              let s = stemmRuEn(w);

              if (s) {
                wordsStats.reg(w, s, uId, monthId);
              }
            });
          }

          for (let u in tc.urls) {
            _set(stats, "sitesCount", tc.urls[u]);
            msg.sitesCount = tc.urls[u];

            _set(mStats, "sites", u, tc.urls[u]);
            _set(total, "sites", u, tc.urls[u]);
            _set(usersTotal, uId, "sites", u, tc.urls[u]);
          }

          for (let h in tc.hashTags) {
            _set(stats, "hashTagsCount", tc.hashTags[h]);
            msg.hashTagsCount = tc.hashTags[h];

            _set(mStats, "hashTags", h, tc.hashTags[h]);
            _set(total, "hashTags", h, tc.hashTags[h]);
            _set(usersTotal, uId, "hashTags", h, tc.hashTags[h]);
          }

          for (let m in tc.mentions) {
            let mention = fixMention(users, m);

            if (mention) {
              _set(stats, "mentionsCount", tc.mentions[m]);
              msg.mentionsCount = tc.mentions[m];

              _set(mStats, "mentions", mention, tc.mentions[m]);
              _set(total, "mentions", mention, tc.mentions[m]);
              _set(usersTotal, uId, "mentions", mention, tc.mentions[m]);
            }
          }
        }
      }
    }
  }

  sortAndTrimLists(total);

  for (let u in usersTotal) {
    sortAndTrimLists(usersTotal[u]);
  }

  for (let Y in monthly) {
    for (let M in monthly[Y]) {
      sortAndTrimLists(monthly[Y][M]);
    }
  }

  return {
    replyToNowhere,
    skippedUnknown,
    stats: {
      users: Object.fromEntries(
        Object.entries(users).map((u) => [
          u[1].id,
          {
            name: u[1].name,
            alias: u[1].alias,
            aka: u[1].aka,
          },
        ]),
      ),
      total,
      monthly,
      usersTotal,
    },
    messages,
    wordsStats,
    messagesById,
  };
}
