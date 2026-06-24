import "server-only";
import { getDB, mutate, id, now } from "./db";
import { toPublicUser } from "./session";
import { CATEGORIES } from "./constants";
import type {
  CategoryId,
  Comment,
  DB,
  Post,
  PostView,
  PublicUser,
  RoomId,
  User,
} from "./types";

type Viewer = User | null;

const isAdmin = (v: Viewer) => v?.role === "admin";

/** Can this viewer see this post at all? */
export function canView(post: Post, viewer: Viewer): boolean {
  if (post.draft) return viewer?.id === post.authorId;
  if (post.visibility === "redaktion")
    return isAdmin(viewer) || viewer?.id === post.authorId;
  return true;
}

function publicUserById(db: DB, uid: string): PublicUser | null {
  const u = db.users.find((x) => x.id === uid);
  return u ? toPublicUser(u) : null;
}

export function toPostView(db: DB, post: Post, viewer: Viewer): PostView {
  const reactions = db.reactions.filter((r) => r.postId === post.id);
  const emojiReacts = reactions.filter((r) => r.emoji !== "like");
  const grouped = new Map<string, { count: number; mine: boolean }>();
  for (const r of emojiReacts) {
    const cur = grouped.get(r.emoji) ?? { count: 0, mine: false };
    cur.count++;
    if (r.userId === viewer?.id) cur.mine = true;
    grouped.set(r.emoji, cur);
  }
  const likes = reactions.filter((r) => r.emoji === "like");

  // Nominations ("Soll das ins Heft?") are stored as reactions with emoji
  // "nominate" so each person can toggle their own vote.
  const noms = db.reactions.filter(
    (r) => r.postId === post.id && r.emoji === "nominate",
  );

  // Hide author for anon posts unless viewer is admin.
  const showAuthor =
    post.visibility !== "anon" || isAdmin(viewer) || viewer?.id === post.authorId;

  return {
    ...post,
    author: showAuthor ? publicUserById(db, post.authorId) : null,
    tagged: post.taggedUserIds
      .map((uid) => publicUserById(db, uid))
      .filter((x): x is PublicUser => !!x),
    reactions: [...grouped.entries()].map(([emoji, v]) => ({ emoji, ...v })),
    likeCount: likes.length,
    iLiked: likes.some((r) => r.userId === viewer?.id),
    commentCount: db.comments.filter((c) => c.postId === post.id).length,
    nominationCount: noms.length,
    iNominated: noms.some((r) => r.userId === viewer?.id),
    nominatedForYearbook: post.nominatedForYearbook || noms.length > 0,
  };
}

export interface PostFilter {
  category?: CategoryId;
  room?: RoomId;
  type?: string;
  tag?: string;
  personId?: string;
  q?: string;
  year?: string;
  event?: string;
  nominated?: boolean;
  authorId?: string;
  sort?: "new" | "top" | "random";
}

function roomCategories(room: RoomId): CategoryId[] {
  return CATEGORIES.filter((c) => c.room === room).map((c) => c.id);
}

export async function listPosts(
  viewer: Viewer,
  filter: PostFilter = {},
): Promise<PostView[]> {
  const db = await getDB();
  let posts = db.posts.filter((p) => canView(p, viewer));

  if (filter.category) posts = posts.filter((p) => p.category === filter.category);
  if (filter.room) {
    const cats = roomCategories(filter.room);
    posts = posts.filter((p) => cats.includes(p.category));
  }
  if (filter.type) posts = posts.filter((p) => p.type === filter.type);
  if (filter.tag) posts = posts.filter((p) => p.tags.includes(filter.tag!));
  if (filter.year) posts = posts.filter((p) => p.year === filter.year);
  if (filter.event) posts = posts.filter((p) => p.event === filter.event);
  if (filter.authorId) posts = posts.filter((p) => p.authorId === filter.authorId);
  if (filter.nominated)
    posts = posts.filter(
      (p) =>
        p.nominatedForYearbook ||
        db.reactions.some((r) => r.postId === p.id && r.emoji === "nominate"),
    );
  if (filter.personId)
    posts = posts.filter(
      (p) =>
        p.taggedUserIds.includes(filter.personId!) ||
        p.authorId === filter.personId,
    );
  if (filter.q) {
    const q = filter.q.toLowerCase();
    posts = posts.filter((p) =>
      [p.title, p.body, p.event, ...(p.tags ?? [])]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q)),
    );
  }

  const views = posts.map((p) => toPostView(db, p, viewer));
  const sort = filter.sort ?? "new";
  if (sort === "top") {
    views.sort(
      (a, b) =>
        b.likeCount + b.commentCount * 2 + b.nominationCount * 3 -
        (a.likeCount + a.commentCount * 2 + a.nominationCount * 3),
    );
  } else if (sort === "random") {
    views.sort(() => Math.random() - 0.5);
  } else {
    views.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  // pinned first for default sort
  if (sort === "new") views.sort((a, b) => Number(b.pinned) - Number(a.pinned));
  return views;
}

export async function getPostView(
  viewer: Viewer,
  postId: string,
): Promise<PostView | null> {
  const db = await getDB();
  const post = db.posts.find((p) => p.id === postId);
  if (!post || !canView(post, viewer)) return null;
  return toPostView(db, post, viewer);
}

export async function createPost(
  author: User,
  data: Omit<
    Post,
    | "id"
    | "authorId"
    | "createdAt"
    | "pinned"
    | "reportCount"
    | "nominatedForYearbook"
  > & { nominatedForYearbook?: boolean },
): Promise<Post> {
  const post: Post = {
    id: id(),
    authorId: author.id,
    createdAt: now(),
    pinned: false,
    reportCount: 0,
    nominatedForYearbook: data.nominatedForYearbook ?? false,
    ...data,
  };
  await mutate((db) => {
    db.posts.push(post);
    // notify tagged users
    for (const uid of post.taggedUserIds) {
      if (uid === author.id) continue;
      db.notifications.push({
        id: id(),
        userId: uid,
        type: "tag",
        text: `Du wurdest in einem Beitrag markiert`,
        href: `/post/${post.id}`,
        read: false,
        createdAt: now(),
      });
    }
  });
  return post;
}

export async function toggleReaction(
  userId: string,
  postId: string,
  emoji: string,
): Promise<void> {
  await mutate((db) => {
    const existing = db.reactions.find(
      (r) => r.postId === postId && r.userId === userId && r.emoji === emoji,
    );
    if (existing) {
      db.reactions = db.reactions.filter((r) => r.id !== existing.id);
    } else {
      db.reactions.push({ id: id(), postId, userId, emoji });
      const post = db.posts.find((p) => p.id === postId);
      if (post && post.authorId !== userId && emoji !== "nominate") {
        db.notifications.push({
          id: id(),
          userId: post.authorId,
          type: "reaction",
          text: `Jemand hat auf deinen Beitrag reagiert ${emoji === "like" ? "❤️" : emoji}`,
          href: `/post/${postId}`,
          read: false,
          createdAt: now(),
        });
      }
    }
  });
}

export async function addComment(
  author: User,
  postId: string,
  body: string,
  anon: boolean,
  parentId?: string,
): Promise<Comment> {
  const comment: Comment = {
    id: id(),
    postId,
    authorId: author.id,
    parentId,
    body,
    anon,
    createdAt: now(),
  };
  await mutate((db) => {
    db.comments.push(comment);
    const post = db.posts.find((p) => p.id === postId);
    if (post && post.authorId !== author.id) {
      db.notifications.push({
        id: id(),
        userId: post.authorId,
        type: "comment",
        text: `Neuer Kommentar zu deinem Beitrag`,
        href: `/post/${postId}`,
        read: false,
        createdAt: now(),
      });
    }
  });
  return comment;
}

export interface CommentView extends Comment {
  author: PublicUser | null;
}

export async function listComments(
  viewer: Viewer,
  postId: string,
): Promise<CommentView[]> {
  const db = await getDB();
  return db.comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((c) => ({
      ...c,
      author:
        !c.anon || isAdmin(viewer) || c.authorId === viewer?.id
          ? publicUserById(db, c.authorId)
          : null,
    }));
}

export async function deletePost(postId: string): Promise<void> {
  await mutate((db) => {
    db.posts = db.posts.filter((p) => p.id !== postId);
    db.reactions = db.reactions.filter((r) => r.postId !== postId);
    db.comments = db.comments.filter((c) => c.postId !== postId);
    db.collectionItems = db.collectionItems.filter((ci) => ci.postId !== postId);
  });
}

export async function setPinned(postId: string, pinned: boolean): Promise<void> {
  await mutate((db) => {
    const p = db.posts.find((x) => x.id === postId);
    if (p) p.pinned = pinned;
  });
}

export async function listClassmates(): Promise<PublicUser[]> {
  const db = await getDB();
  return db.users
    .filter((u) => u.isClassmate)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(toPublicUser);
}

export async function getUserPublic(uid: string): Promise<PublicUser | null> {
  const db = await getDB();
  const u = db.users.find((x) => x.id === uid);
  return u ? toPublicUser(u) : null;
}

export async function listNotifications(userId: string) {
  const db = await getDB();
  return db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markNotificationsRead(userId: string) {
  await mutate((db) => {
    for (const n of db.notifications) if (n.userId === userId) n.read = true;
  });
}
