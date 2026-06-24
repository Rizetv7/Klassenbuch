import type { CategoryId, PostType, RoomId, TextStyle, Visibility } from "./types";

export const ACCENTS = {
  blue: "#4d7cfe",
  pink: "#ff6fb5",
  yellow: "#ffc93c",
  green: "#36c58f",
  purple: "#9b7bff",
} as const;

export interface RoomMeta {
  id: RoomId;
  name: string;
  tagline: string;
  emoji: string;
  accent: keyof typeof ACCENTS;
  categories: CategoryId[];
}

export const ROOMS: RoomMeta[] = [
  {
    id: "klassenraum",
    name: "Klassenraum",
    tagline: "Personen, Zitate & Lehrer-Momente",
    emoji: "🎓",
    accent: "blue",
    categories: ["personen", "lehrer", "zitate"],
  },
  {
    id: "reisezimmer",
    name: "Reisezimmer",
    tagline: "Lager, Reisen, Ausflüge & Bilder",
    emoji: "✈️",
    accent: "green",
    categories: ["reisen", "bilder"],
  },
  {
    id: "meme-keller",
    name: "Meme-Keller",
    tagline: "Insider, cursed Bilder, Sticker & Chaos",
    emoji: "😈",
    accent: "pink",
    categories: ["insider-memes", "sticker"],
  },
  {
    id: "redaktionsraum",
    name: "Redaktionsraum",
    tagline: "Ideen, Abstimmungen & Sammlungen",
    emoji: "📰",
    accent: "yellow",
    categories: ["ideen", "honorable-mentions"],
  },
];

export interface CategoryMeta {
  id: CategoryId;
  name: string;
  emoji: string;
  room: RoomId;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "personen", name: "Personen", emoji: "🧑", room: "klassenraum" },
  { id: "lehrer", name: "Lehrer", emoji: "👩‍🏫", room: "klassenraum" },
  { id: "zitate", name: "Zitate", emoji: "💬", room: "klassenraum" },
  { id: "bilder", name: "Bilder", emoji: "📸", room: "reisezimmer" },
  { id: "reisen", name: "Reisen", emoji: "🧳", room: "reisezimmer" },
  {
    id: "honorable-mentions",
    name: "Honorable Mentions",
    emoji: "🏆",
    room: "redaktionsraum",
  },
  { id: "insider-memes", name: "Insider & Memes", emoji: "🤡", room: "meme-keller" },
  { id: "ideen", name: "Ideen", emoji: "💡", room: "redaktionsraum" },
  { id: "sticker", name: "Sticker", emoji: "✨", room: "meme-keller" },
];

export function categoryMeta(id: CategoryId): CategoryMeta {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}
export function roomMeta(id: RoomId): RoomMeta | undefined {
  return ROOMS.find((r) => r.id === id);
}

export interface PostTypeMeta {
  id: PostType;
  name: string;
  emoji: string;
  needsImage: boolean;
  defaultCategory: CategoryId;
}

export const POST_TYPES: PostTypeMeta[] = [
  { id: "bild", name: "Bild", emoji: "📷", needsImage: true, defaultCategory: "bilder" },
  { id: "reisebild", name: "Reisebild", emoji: "🏖️", needsImage: true, defaultCategory: "reisen" },
  { id: "zitat", name: "Zitat", emoji: "💬", needsImage: false, defaultCategory: "zitate" },
  { id: "lehrerzitat", name: "Lehrerzitat", emoji: "👩‍🏫", needsImage: false, defaultCategory: "lehrer" },
  { id: "story", name: "Story", emoji: "📖", needsImage: false, defaultCategory: "personen" },
  { id: "honorable-mention", name: "Honorable Mention", emoji: "🏆", needsImage: false, defaultCategory: "honorable-mentions" },
  { id: "meme", name: "Meme", emoji: "🤣", needsImage: true, defaultCategory: "insider-memes" },
  { id: "sticker", name: "Sticker", emoji: "✨", needsImage: true, defaultCategory: "sticker" },
  { id: "idee", name: "Idee", emoji: "💡", needsImage: false, defaultCategory: "ideen" },
  { id: "profiltext", name: "Profiltext", emoji: "🪪", needsImage: false, defaultCategory: "personen" },
  { id: "moment", name: "Moment", emoji: "⭐", needsImage: false, defaultCategory: "bilder" },
];

export function postTypeMeta(id: PostType): PostTypeMeta {
  return POST_TYPES.find((t) => t.id === id) ?? POST_TYPES[0];
}

export const VISIBILITY_OPTIONS: { id: Visibility; name: string; desc: string; emoji: string }[] = [
  { id: "public", name: "Öffentlich mit Name", desc: "Alle sehen, dass es von dir ist", emoji: "🙂" },
  { id: "anon", name: "Anonym", desc: "Dein Name wird niemandem gezeigt", emoji: "🕶️" },
  { id: "redaktion", name: "Nur Redaktion", desc: "Nur Admins/Redaktion sehen es", emoji: "🔒" },
];

export const REACTIONS = ["❤️", "😂", "🔥", "👏", "😮", "🥹"] as const;

export const TIMELINE_YEARS = [
  "1. Klasse",
  "2. Klasse",
  "3. Klasse",
  "4. Klasse",
  "Abschlussjahr",
] as const;

export const TAG_SUGGESTIONS = [
  "lustig",
  "cursed",
  "wholesome",
  "legendär",
  "iconic",
  "running-gag",
  "skilager",
  "abschlussreise",
  "party",
  "unterricht",
  "sport",
  "throwback",
];

export const TEXT_STYLES: { id: TextStyle; name: string }[] = [
  { id: "tiktok", name: "TikTok (weiss + Rand)" },
  { id: "bubble-white", name: "Weisse Bubble" },
  { id: "bubble-black", name: "Schwarze Bubble" },
  { id: "bubble-color", name: "Farbige Bubble" },
  { id: "imessage", name: "iMessage" },
  { id: "meme", name: "Meme" },
  { id: "handwritten", name: "Handschrift" },
  { id: "newspaper", name: "Zeitung" },
];

export const STICKER_PRESETS = [
  "⭐",
  "❤️",
  "🔥",
  "💯",
  "😂",
  "👑",
  "✨",
  "📌",
  "🎉",
  "💀",
  "🫶",
  "➡️",
  "certified iconic",
  "war dabei",
  "quote of the year",
  "unhinged",
  "Matura 2027",
  "legendär",
];

export const SESSION_COOKIE = "kb_session";
