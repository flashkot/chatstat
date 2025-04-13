export const FORMAT_VERSION = 3;
export const LISTS_NAMES = ["reactions", "forwardsFrom", "mentions", "sites", "hashTags"];
export const STATS_FIELDS = [
  "messages",
  "bustle",
  "texts",
  "symbols",
  "words",
  "replies",
  "receivedReplies",
  "forwards",
  "media",
  "edits",
  "images",
  "videos",
  "audios",
  "otherFiles",
  "photoFileSize",
  "audioFileSize",
  "videoFilesize",
  "otherFileSize",
  "megapixels",
  "video_seconds",
  "audio_seconds",
  "stickers",
  "reactionsCount",
  "hashTagsCount",
  "mentionsCount",
  "sitesCount",
];

// this is random. IDK why exactly 10 times (since BitMask stores 7 bits in byte)
export const MAX_USERS_FOR_BITMASK = 7 * 10;
