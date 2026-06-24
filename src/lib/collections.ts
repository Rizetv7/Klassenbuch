import "server-only";
import { getDB, mutate, id, now } from "./db";
import { toPostView } from "./repo";
import type { Collection, CollectionItem, PostView, User } from "./types";

export interface CollectionView extends Collection {
  itemCount: number;
  cover?: PostView | null;
  canEdit: boolean;
}

const canEdit = (c: Collection, u: User | null) =>
  !!u && (u.role === "admin" || u.id === c.ownerId || c.memberIds.includes(u.id));

export async function listCollections(viewer: User | null): Promise<CollectionView[]> {
  const db = await getDB();
  return db.collections
    .filter((c) => c.isPublic || canEdit(c, viewer))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((c) => {
      const cover = c.coverPostId
        ? db.posts.find((p) => p.id === c.coverPostId)
        : undefined;
      return {
        ...c,
        itemCount: db.collectionItems.filter((ci) => ci.collectionId === c.id).length,
        cover: cover ? toPostView(db, cover, viewer) : null,
        canEdit: canEdit(c, viewer),
      };
    });
}

export interface CollectionDetail extends CollectionView {
  items: (CollectionItem & { post: PostView | null })[];
}

export async function getCollection(
  viewer: User | null,
  cid: string,
): Promise<CollectionDetail | null> {
  const db = await getDB();
  const c = db.collections.find((x) => x.id === cid);
  if (!c) return null;
  if (!c.isPublic && !canEdit(c, viewer)) return null;
  const items = db.collectionItems
    .filter((ci) => ci.collectionId === cid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((ci) => {
      const post = db.posts.find((p) => p.id === ci.postId);
      return { ...ci, post: post ? toPostView(db, post, viewer) : null };
    });
  const cover = c.coverPostId ? db.posts.find((p) => p.id === c.coverPostId) : undefined;
  return {
    ...c,
    itemCount: items.length,
    cover: cover ? toPostView(db, cover, viewer) : null,
    canEdit: canEdit(c, viewer),
    items,
  };
}

export async function createCollection(
  owner: User,
  name: string,
  description: string,
  isPublic: boolean,
): Promise<Collection> {
  const col: Collection = {
    id: id(),
    name,
    description,
    ownerId: owner.id,
    memberIds: [],
    isPublic,
    createdAt: now(),
  };
  await mutate((db) => db.collections.push(col));
  return col;
}

export async function addToCollection(
  user: User,
  collectionId: string,
  postId: string,
): Promise<void> {
  await mutate((db) => {
    const c = db.collections.find((x) => x.id === collectionId);
    if (!c || !canEdit(c, user)) throw new Error("FORBIDDEN");
    const exists = db.collectionItems.find(
      (ci) => ci.collectionId === collectionId && ci.postId === postId,
    );
    if (exists) return;
    db.collectionItems.push({
      id: id(),
      collectionId,
      postId,
      addedBy: user.id,
      createdAt: now(),
    });
    if (!c.coverPostId) c.coverPostId = postId;
  });
}

export async function removeFromCollection(
  user: User,
  collectionId: string,
  itemId: string,
): Promise<void> {
  await mutate((db) => {
    const c = db.collections.find((x) => x.id === collectionId);
    if (!c || !canEdit(c, user)) throw new Error("FORBIDDEN");
    db.collectionItems = db.collectionItems.filter((ci) => ci.id !== itemId);
  });
}

export async function setItemStatus(
  user: User,
  collectionId: string,
  itemId: string,
  status: CollectionItem["status"],
): Promise<void> {
  await mutate((db) => {
    const c = db.collections.find((x) => x.id === collectionId);
    if (!c || !canEdit(c, user)) throw new Error("FORBIDDEN");
    const it = db.collectionItems.find((ci) => ci.id === itemId);
    if (it) it.status = status;
  });
}
