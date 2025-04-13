export class WordsStats {
  constructor() {
    this.stats = new Map();
    this.monthsTotal = new Map();
    this.usersTotal = new Map();
  }

  reg(word, stemm, userId, monthId) {
    this.monthsTotal.set(monthId, 1 + (this.monthsTotal.get(monthId) ?? 0));
    this.usersTotal.set(userId, 1 + (this.usersTotal.get(userId) ?? 0));

    if (!this.stats.has(stemm)) {
      this.stats.set(stemm, {
        word: new Map(),
        months: new Map(),
        users: new Map(),
        wordCount: 0,
      });
    }

    let wStat = this.stats.get(stemm);

    wStat.word.set(word, 1 + (wStat.word.get(word) ?? 0));
    wStat.wordCount++;

    wStat.months.set(monthId, 1 + (wStat.months.get(monthId) ?? 0));
    wStat.users.set(userId, 1 + (wStat.users.get(userId) ?? 0));
  }

  preCalc() {
    this.stats.forEach((stemm) => {
      stemm.word = [...stemm.word.entries()].sort((a, b) => b[1] - a[1])[0][0];

      // months
      stemm.mAvg = 0;

      this.monthsTotal.forEach(
        (count, month) => (stemm.mAvg += (stemm.months.get(month) ?? 0) / count),
      );

      stemm.mAvg /= this.monthsTotal.size;

      //users
      stemm.uAvg = 0;
      stemm.uMin = Infinity;
      stemm.uMax = -Infinity;

      this.usersTotal.forEach((count, user) => {
        let f = (stemm.users.get(user) ?? 0) / count;

        stemm.uMin = Math.min(stemm.uMin, f);
        stemm.uMax = Math.max(stemm.uMax, f);
        stemm.uAvg += f;
      });

      stemm.uAvg /= this.usersTotal.size;
    });
  }

  getMonthCloud(monthId) {
    let result = [];

    this.stats.forEach((stat) => {
      let c = stat.months.get(monthId) ?? 0;

      if (c) {
        result.push({
          word: stat.word,
          count: c,
          weight: c == 1 ? 1 : c ** 2 / this.monthsTotal.get(monthId) / stat.mAvg,
        });
      }
    });

    return result.sort((a, b) => b.weight - a.weight).slice(0, 1000);
  }

  getUserCloud(userId) {
    let result = [];

    this.stats.forEach((stat) => {
      let c = stat.users.get(userId) ?? 0;

      if (c) {
        result.push({
          word: stat.word,
          count: c,
          weight: c == 1 ? 1 : c ** 2 / this.usersTotal.get(userId) / stat.uAvg,
        });
      }
    });

    return result.sort((a, b) => b.weight - a.weight).slice(0, 1000);
  }

  getAllTimeCloud() {
    let result = [];

    this.stats.forEach((stat) => {
      result.push({
        word: stat.word,
        count: stat.wordCount,
        weight: stat.wordCount == 1 ? 1 : stat.wordCount * ((stat.uMax - stat.uMin) / stat.uAvg),
      });
    });

    return result
      .filter((w) => w.weight != 0)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 1000);
  }

  getCloudsNum() {
    // 1 here is for All-time cloud
    return 1 + this.monthsTotal.size + this.usersTotal.size;
  }
}
