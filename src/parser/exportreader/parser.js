import { prepareMessage } from "./preparemessage.js";
import { validateMessage } from "./validator.js";

export function transfromExport(messages) {
  const users = {};
  const messagesById = new Array(messages.length);
  let replyToNowhere = 0;

  const processedMessages = [];
  let parsedId = 0;

  let pos = 0;

  while (pos < messages.length) {
    let msg = messages[pos++];

    validateMessage(msg);

    if (msg.from_id) {
      if (!users[msg.from_id]) {
        users[msg.from_id] = {
          tId: msg.from_id,
          name: msg.from || msg.from_id,
          messages: 0,
        };
      }
      users[msg.from_id].messages++;
    }

    if (msg.reply_to_message_id) {
      if (msg.reply_to_peer_id || !messagesById[msg.reply_to_message_id]) {
        replyToNowhere++;
      } else {
        msg._orig_reply_to_message_id = msg.reply_to_message_id;
        msg.reply_to_message_id = messagesById[msg.reply_to_message_id].id;

        if (!messagesById[msg.reply_to_message_id].replies) {
          messagesById[msg.reply_to_message_id].replies = [];
        }

        messagesById[msg.reply_to_message_id].replies.push(msg.id);
      }
    }

    while (messages[pos]) {
      // breaking grupped messages
      //

      // messages in group have same timestammp
      if (messages[pos].date_unixtime != msg.date_unixtime) {
        break;
      }

      // different poster (this is where error was! note the translations of ids!)
      if (messages[pos].from_id != msg.from_id) {
        break;
      }

      // different replies
      if (messages[pos].reply_to_message_id != msg.reply_to_message_id) {
        break;
      }

      // or different forwards
      if (messages[pos].forwarded_from != msg.forwarded_from) {
        break;
      }

      // okay, this is indeed a group message
      if (!msg._messageGroup) {
        msg._messageGroup = [];
      }

      msg._messageGroup.push(messages[pos]);

      pos++;
    }

    let parsed = prepareMessage(msg);

    messagesById[parsed.id] = parsed;
    parsed.parsedId = parsedId++;
    processedMessages.push(parsed);

    if (msg._messageGroup) {
      msg._messageGroup.forEach((m) => (messagesById[m.id] = parsed));
    }
  }

  return {
    users,
    messages: processedMessages,
    messagesById,
    replyToNowhere,
  };
}
