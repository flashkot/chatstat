import { defineStore } from "pinia";
import { strCompare } from "@/utils/collator";
import { loadData } from "@/store/dataFetcher";

function statsRowObj() {
  return {
    messages: 0,
    bustle: 0,
    texts: 0,
    symbols: 0,
    words: 0,
    replies: 0,
    receivedReplies: 0,
    forwards: 0,
    media: 0,
    edits: 0,
    images: 0,
    videos: 0,
    audios: 0,
    files: 0,
    otherFiles: 0,
    photoFileSize: 0,
    audioFileSize: 0,
    videoFilesize: 0,
    otherFileSize: 0,
    totalFileSize: 0,
    megapixels: 0,
    video_seconds: 0,
    audio_seconds: 0,
    stickers: 0,
    reactionsCount: 0,
    hashTagsCount: 0,
    mentionsCount: 0,
    sitesCount: 0,
    daysActive: 0,
  };
}

export const useChatStore = defineStore("chatStore", {
  state: () => ({
    loaded: false,
    stats: null,
    treeMap: null,
    packedSize: 0,
    storage: null,
    mode: "dev",
    appVersion: "?dev",
  }),

  getters: {
    isLoaded: (state) => state.loaded,

    monthList: (state) => {
      let monthIds = [];

      for (let Y in state.stats.monthly) {
        for (let M in state.stats.monthly[Y]) {
          monthIds.push({
            text: Y + "-" + String(Number(M) + 1).padStart(2, 0),
            value: Y + "-" + String(Number(M) + 1).padStart(2, 0),
          });
        }
      }

      return monthIds.sort((a, b) => strCompare(b.text, a.text));
    },

    usersList: (state) =>
      Object.entries(state.stats.users)
        .map((u) => ({ text: u[1].name, value: u[0] }))
        .sort((a, b) => strCompare(a.text, b.text)),

    latestMonth: (state) => state.monthList.at(0).value,
  },

  actions: {
    async fetchData() {
      return loadData().then((d) => {
        this.stats = d.stats.data;
        this.treeMap = d.stats.treeMap;
        this.storage = d.storage;
        this.loaded = true;
        this.mode = d.mode;
        this.appVersion = d.appVersion;
      });
    },

    getStats(monthId, uId) {
      let Y, M;
      let stats = statsRowObj();

      stats.daysInStats = 0;

      stats.users = {};
      stats.postPerDay = {};
      stats.postPerWeekHour = {};

      let yList;

      if (monthId) {
        [Y, M] = monthId.split("-");
        M = String(Number(M) - 1).padStart(2, "0");
        monthId = Y + "-" + M;
        yList = [Y];
      } else {
        yList = Object.keys(this.stats.monthly);
      }

      yList.forEach((sY) => {
        let mList;

        if (monthId) {
          mList = [M];
        } else {
          mList = Object.keys(this.stats.monthly[sY]);
        }

        stats.postPerDay[sY] = {};

        mList.forEach((sM) => {
          let month = this.stats.monthly[sY][Number(sM)];

          let uList;

          if (uId) {
            uList = [uId];
          } else {
            uList = Object.keys(month.users);
          }

          if (!uId) {
            stats.postPerDay[sY][sM] = {};
            for (let d in month.postPerDay) {
              if (!stats.postPerDay[sY][sM][d]) stats.postPerDay[sY][sM][d] = 0;
              stats.postPerDay[sY][sM][d] += month.postPerDay[d];
              stats.daysInStats++;
            }

            for (let wD in month.postPerWeekHour) {
              if (!stats.postPerWeekHour[wD]) stats.postPerWeekHour[wD] = {};

              for (let wH in month.postPerWeekHour[wD]) {
                if (!stats.postPerWeekHour[wD][wH]) stats.postPerWeekHour[wD][wH] = 0;
                stats.postPerWeekHour[wD][wH] += month.postPerWeekHour[wD][wH];
              }
            }
          }

          uList.forEach((sU) => {
            if (!stats.users[sU]) {
              stats.users[sU] = statsRowObj();
              stats.users[sU].id = sU;
              stats.users[sU].name = this.stats.users[sU].name;
              stats.users[sU].color = `hsl(${sU * 18}, 50%, 50%)`;
            }

            for (let p in month.users[sU]) {
              stats[p] += month.users[sU][p];
              stats.users[sU][p] += month.users[sU][p];

              if (["images", "videos", "audios", "otherFiles"].includes(p)) {
                stats.files += month.users[sU][p];
                stats.users[sU].files += month.users[sU][p];
              }

              if (
                ["photoFileSize", "audioFileSize", "videoFilesize", "otherFileSize"].includes(p)
              ) {
                stats.totalFileSize += month.users[sU][p];
                stats.users[sU].totalFileSize += month.users[sU][p];
              }
            }

            stats.users[sU].daysActive += Object.keys(
              this.stats.usersTotal[sU].postPerDay[sY]?.[Number(sM)] ?? {},
            ).length;
          });
        });
      });

      // I expect this method be called with either monthI or userId or nothing
      let src;
      if (monthId) {
        src = this.stats.monthly[Y][Number(M)];
        stats.wordCloud = this.stats.wordClouds.months[monthId];
      } else if (uId) {
        src = this.stats.usersTotal[uId];
        stats.wordCloud = this.stats.wordClouds.users[uId];
      } else {
        src = this.stats.total;
        stats.wordCloud = this.stats.wordClouds.total;
      }

      stats.reactions = src.reactions;
      stats.forwardsFrom = src.forwardsFrom;
      stats.mentions = src.mentions;
      stats.sites = src.sites;
      stats.hashTags = src.hashTags;

      if (uId) {
        stats.postPerDay = this.stats.usersTotal[uId].postPerDay;
        stats.postPerWeekHour = this.stats.usersTotal[uId].postPerWeekHour;

        for (let Y in stats.postPerDay) {
          for (let M in stats.postPerDay[Y]) {
            stats.daysInStats += Object.keys(stats.postPerDay[Y][M]).length;
          }
        }
      }

      // recalc bustle as per message
      for (let u in stats.users) {
        if (stats.users[u].messages) {
          stats.users[u].bustle = Math.floor(
            (10 * stats.users[u].bustle) / stats.users[u].messages,
          );
        } else {
          stats.users[u].bustle = 0;
        }
      }

      return stats;
    },
  },
});
