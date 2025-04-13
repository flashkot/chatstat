import { setOrCreate } from "../utils/setorcreate.js";

const COPY_FIELDS = [
  "id",
  "type",
  "actor",
  "actor_id",
  "action",
  "from_id",
  "reply_to_message_id",
  "forwarded_from",
  "via_bot",
  "message_id", // used in action "pin_message"
  "duration", // used in action "group_call"
  "reply_to_peer_id", // strange type of reply to another channel
  "boosts", // used with "boost_apply", action. contains num of boosts
  "replies",
];

// _messageGroup

export function prepareMessage(msg) {
  let result = {
    text_entities: [],
  };

  let _set = (...params) => setOrCreate.apply(null, [result, ...params]);

  COPY_FIELDS.forEach((f) => (result[f] = msg[f]));

  result.date_unixtime = Number(msg.date_unixtime);

  let mList = [msg];

  if (msg._messageGroup) {
    mList = [msg, ...msg._messageGroup];
    result.is_groupped = true;
    result._messageGroup = msg._messageGroup.map((m) => m.id);
  }

  mList.forEach((m) => {
    result.text_entities = [...result.text_entities, ...m.text_entities];

    if (m.edited_unixtime) {
      m.edited_unixtime = Number(m.edited_unixtime);

      if (!result.edited_unixtime || result.edited_unixtime < m.edited_unixtime) {
        result.edited_unixtime = m.edited_unixtime;
      }
    }

    if (m.reactions) {
      if (!result.reactions) {
        result.reactions = {};
      }

      Object.entries(m.reactions).map((r) =>
        _set("reactions", r[1].emoji ?? "custom", r[1].count ?? 0),
      );
    }

    if (m.sticker_emoji || m.media_type == "sticker") {
      _set("stickers", 1);
    } else {
      if (m.photo) {
        result.media = 1;
        _set("images", 1);
        _set("photoFileSize", m.photo_file_size);

        if (m.width && m.height) {
          _set("megapixels", m.width * m.height);
        }
      }

      if (m.file_size) {
        if (m.mime_type && m.mime_type.startsWith("video/")) {
          _set("videos", 1);
          _set("videoFilesize", m.file_size);
          _set("video_seconds", m.duration_seconds ? m.duration_seconds : 0);
        } else if (m.mime_type && m.mime_type.startsWith("audio/")) {
          _set("audios", 1);
          _set("audioFileSize", m.file_size);
          _set("audio_seconds", m.duration_seconds ? m.duration_seconds : 0);
        } else {
          _set("otherFiles", 1);
          _set("otherFileSize", m.file_size);
        }
      }
    }
  });

  return result;
}
