export function calcBustle(messages, messagesById, monthly) {
  let bustle = 0;
  let lastTs = 0;

  for (let i = messages.length - 1; i > 0; i--) {
    let m = messages[i];
    if (!Object.hasOwn(m, "_uId")) {
      continue;
    }

    if (!m.bustle) {
      m.bustle = 0;
    }

    if (lastTs - m.date_unixtime > 15 * 60) {
      bustle = 0;
    }
    lastTs = m.date_unixtime;

    bustle = m.bustle += ++bustle;

    if (m.reply_to_message_id && messagesById[m.reply_to_message_id]) {
      let rt = messagesById[m.reply_to_message_id];

      if (m.date_unixtime - rt.date_unixtime < 4 * 60 * 60) {
        rt.bustle = m.bustlel;
      }

      messagesById[m.reply_to_message_id].bustle += m.bustle;
    }
  }

  messages.forEach((m) => {
    if (!Object.hasOwn(m, "_uId")) {
      return;
    }

    let stats = monthly[m._date.mY][m._date.mM].users[m._uId];

    if (stats && stats.messages) {
      if (!stats.bustle) {
        stats.bustle = 0;
      }

      stats.bustle += m.bustle;
    }
  });
}
