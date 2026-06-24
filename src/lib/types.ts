// Core domain types for Klassenbuch (Matura Memory Hub)

export type Role = "member" | "admin";

export type Visibility = "public" | "anon" | "redaktion";

export type PostType =
  | "bild"
  | "zitat"
  | "story"
  | "lehrerzitat"
  | "honorable-mention"
  | "sticker"
  | "idee"
  | "meme"
  | "profiltext"
  | "reisebild"
  | "moment";

export type CategoryId =
  | "personen"
  | "lehrer"
  | "zitate"
  | "bilder"
  | "reisen"
  | "honorable-mentions"
  | "insider-memes"
  | "ideen"
  | "sticker";

export type RoomId =
  | "klassenraum"
  | "reisezimmer"
  | "meme-keller"
  | "redaktionsraum"
  | "archiv";

export interface User {
  id: string;
  name: string;
  nickname?: string;
  bio?: string;
  avatarUrl?: string;
  role: Role;
  /** hashed passphrase for returning on a new device (optional) */
  passHash?: string;
  isClassmate: boolean; // true = real person profile shown in "Personen"
  createdAt: string;
}

export interface InviteCode {
  code: string;
  label: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

/** A single image with re-editable overlay data (TikTok-style text/stickers). */
export interface Media {
  id: string;
  url: string; // edited/displayed version
  originalUrl: string; // untouched original
  width?: number;
  height?: number;
  /** Overlay layers (text bubbles, stickers) kept as data so they stay editable. */
  overlays?: Overlay[];
}

export type Overlay =
  | {
      kind: "text";
      id: string;
      text: string;
      style: TextStyle;
      x: number; // 0..1 relative
      y: number;
      rotation: number;
      scale: number;
      color?: string;
    }
  | {
      kind: "sticker";
      id: string;
      sticker: string; // emoji or label
      x: number;
      y: number;
      rotation: number;
      scale: number;
    };

export type TextStyle =
  | "tiktok" // white text, black outline
  | "bubble-white"
  | "bubble-black"
  | "bubble-color"
  | "imessage"
  | "meme"
  | "handwritten"
  | "newspaper";

export interface Post {
  id: string;
  authorId: string;
  type: PostType;
  category: CategoryId;
  visibility: Visibility;
  title?: string;
  body?: string; // quote text / story / description
  media: Media[];
  taggedUserIds: string[]; // people this is about / who is in it
  tags: string[]; // free tags
  year?: string; // timeline bucket, e.g. "1. Klasse" ... "Abschlussjahr"
  event?: string; // e.g. "London 2025"
  nominatedForYearbook: boolean;
  pinned: boolean;
  draft: boolean;
  reportCount: number;
  createdAt: string;
}

export interface Reaction {
  id: string;
  postId: string;
  userId: string;
  emoji: string; // "❤️" "😂" "🔥" "👏" "😮" or "like"
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  parentId?: string;
  body: string;
  anon: boolean;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[]; // collaborators
  isPublic: boolean;
  coverPostId?: string;
  createdAt: string;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  postId: string;
  status?: "favorit" | "fast-sicher" | "braucht-kontext" | "loeschen?";
  note?: string;
  addedBy: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "comment" | "reaction" | "tag" | "collection" | "system";
  text: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

export interface Sticker {
  id: string;
  label: string;
  url?: string; // image sticker, else emoji/label
  emoji?: string;
  uploadedBy?: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
}

export interface DB {
  users: User[];
  invites: InviteCode[];
  posts: Post[];
  reactions: Reaction[];
  comments: Comment[];
  collections: Collection[];
  collectionItems: CollectionItem[];
  notifications: Notification[];
  stickers: Sticker[];
  sessions: Session[];
}

/** A post with resolved relations, ready for the UI. */
export interface PostView extends Post {
  author: PublicUser | null; // null when anon and viewer is not admin
  tagged: PublicUser[];
  reactions: { emoji: string; count: number; mine: boolean }[];
  likeCount: number;
  iLiked: boolean;
  commentCount: number;
  nominationCount: number;
  iNominated: boolean;
}

export type PublicUser = Pick<
  User,
  "id" | "name" | "nickname" | "avatarUrl" | "role" | "isClassmate"
>;
