const KNOWN_FIELDS = [
  "id",
  "type",
  "date",
  "date_unixtime",
  "actor",
  "actor_id",
  "action",
  "title",
  "members",
  "text",
  "text_entities",
  "photo",
  "photo_file_size",
  "width",
  "height",
  "from",
  "from_id",
  "file",
  "file_name",
  "file_size",
  "thumbnail",
  "thumbnail_file_size",
  "media_type",
  "mime_type",
  "duration_seconds",
  "edited",
  "edited_unixtime",
  "reactions",
  "reply_to_message_id",
  "inviter",
  "forwarded_from",
  "saved_from", //something related to forwards
  "via_bot", // bot message but it looks like usere posted it. same as forward to me
  "sticker_emoji",
  "location_information",
  "poll",
  "message_id", // used in action "pin_message"
  "duration", // used in action "group_call"
  "inline_bot_buttons",
  "performer",
  "media_spoiler",
  "place_name",
  "address",
  "live_location_period_seconds",
  "reply_to_peer_id", // strange type of reply to another channel
  "boosts", // used with "boost_apply", action. contains num of boosts
  "contact_information", // object with info about shared contact
  ////////////////////
  "game_title",
  "game_description",
  "game_link",
  "game_message_id",
  "score",
  "author",
  "bank_card", // used with action "set_messages_ttl". In seconds.
  "period",
  "new_title",
  "new_icon_emoji_id",
  "discard_reason", // in case of unanswered call (in private chats)
];

const KNOWN_TYPES = ["service", "message"];

const KNOWN_MEDIA_TYPES = [
  "animation",
  "audio_file",
  "sticker",
  "video_file",
  "video_message",
  "voice_message",
];

const KNOWN_TEXT_TYPES = [
  "blockquote",
  "bold",
  "bot_command",
  "code",
  "custom_emoji",
  "email",
  "hashtag",
  "italic",
  "link",
  "mention_name",
  "mention",
  "phone",
  "pre",
  "spoiler",
  "strikethrough",
  "text_link",
  "underline",
  "bank_card",
  "cashtag",
];

export function validateMessage(msg, throwOnError = false) {
  let err = (e) => {
    if (throwOnError) {
      throw new Error(e);
    } else {
      console.warn(e);
    }
  };

  if (!msg.id) {
    err(`Missing "id" field.`);
  }

  if (!msg.date_unixtime) {
    err(`Missing "date_unixtime" field. Message id: ${msg.id}"`);
  }

  let fields = Object.keys(msg);

  fields.forEach((f) => {
    if (!KNOWN_FIELDS.includes(f)) {
      err(`Unknown field "${f}". Message id: ${msg.id}"`);
    }
  });

  if (!KNOWN_TYPES.includes(msg.type)) {
    err(`Unknown message type "${msg.type}". Message id: ${msg.id}"`);
  }

  if (msg.media_type && !KNOWN_MEDIA_TYPES.includes(msg.media_type)) {
    err(`Unknown media_type "${msg.media_type}". Message id: ${msg.id}"`);
  }

  if (Array.isArray(msg.text)) {
    msg.text.forEach((t) => {
      if (typeof t != "string") {
        if (!KNOWN_TEXT_TYPES.includes(t.type)) {
          err(`Unknown text formatting "${t.type}". Message id: ${msg.id}"`);
        }
      }
    });
  }
}
