import "server-only";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import type { DB } from "./types";

/**
 * Tiny JSON-file backed store. Pure-JS, zero native deps — runs anywhere
 * locally and persists across restarts. The whole DB is held in memory and
 * written through on every mutation, with writes serialized to avoid races.
 *
 * For production (Vercel serverless = ephemeral FS, multiple instances) swap
 * the read/write internals for Postgres (Supabase/Neon). The repository API
 * in repo.ts is the only surface the app uses, so the swap is localized.
 */

// On serverless (Vercel) the project dir is read-only; only the OS temp dir is
// writable. There the store is ephemeral (resets on cold start) — fine for a
// demo. For real persistence swap in Postgres (see README).
export const IS_SERVERLESS = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), "klassenbuch")
  : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function emptyDB(): DB {
  return {
    users: [],
    invites: [],
    posts: [],
    reactions: [],
    comments: [],
    collections: [],
    collectionItems: [],
    notifications: [],
    stickers: [],
    sessions: [],
  };
}

// Survive HMR in dev by stashing on globalThis.
const g = globalThis as unknown as {
  __kb_db?: DB;
  __kb_writing?: Promise<void>;
};

async function load(): Promise<DB> {
  if (g.__kb_db) return g.__kb_db;
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    g.__kb_db = { ...emptyDB(), ...(JSON.parse(raw) as DB) };
  } catch {
    g.__kb_db = seed();
    await persist(g.__kb_db);
  }
  return g.__kb_db;
}

async function persist(db: DB): Promise<void> {
  // Serialize writes so concurrent requests don't clobber the file.
  const prev = g.__kb_writing ?? Promise.resolve();
  g.__kb_writing = prev
    .catch(() => {})
    .then(async () => {
      try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
      } catch {
        // Read-only FS (serverless): keep running from the in-memory copy.
      }
    });
  return g.__kb_writing;
}

export async function getDB(): Promise<DB> {
  return load();
}

export async function saveDB(): Promise<void> {
  if (g.__kb_db) await persist(g.__kb_db);
}

/** Run a mutation against the in-memory DB and persist it. */
export async function mutate<T>(fn: (db: DB) => T): Promise<T> {
  const db = await load();
  const result = fn(db);
  await persist(db);
  return result;
}

export const id = () => nanoid(12);
export const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Seed data — a believable demo class so the app never looks empty.
// ---------------------------------------------------------------------------

function av(name: string) {
  return `/api/avatar/${encodeURIComponent(name)}`;
}
function ph(label: string, color: string) {
  return `/api/ph?l=${encodeURIComponent(label)}&c=${color}`;
}

function seed(): DB {
  const db = emptyDB();
  const ts = (daysAgo: number) =>
    new Date(Date.now() - daysAgo * 86400_000).toISOString();

  // Admin (Redaktion). Recover-passphrase: "matura-admin"
  const admin = {
    id: id(),
    name: "Frau Redaktion",
    nickname: "Chefredaktion",
    role: "admin" as const,
    avatarUrl: av("Frau Redaktion"),
    passHash: bcrypt.hashSync("matura-admin", 8),
    isClassmate: false,
    bio: "Sammelt alles fürs Heft. Löscht nur Mist.",
    createdAt: ts(40),
  };
  db.users.push(admin);

  const names = [
    "Lena Vogt",
    "Jonas Brunner",
    "Mia Keller",
    "Luca Frei",
    "Sophie Meier",
    "Nico Steiner",
    "Emma Roth",
    "Tim Graf",
    "Nina Bühler",
    "Leon Wyss",
  ];
  const classmates = names.map((name, i) => ({
    id: id(),
    name,
    role: "member" as const,
    avatarUrl: av(name),
    isClassmate: true,
    nickname: ["Lenchen", "Jönu", "Mimi", "Lu", "Soph", "Nici", "Emmi", "Timu", "Ninsche", "Leo"][i],
    bio: [
      "immer zu spät, immer dabei",
      "Meme-Beauftragter der Klasse",
      "macht die besten Fotos",
      "Skilager-Legende",
      "kennt jedes Zitat auswendig",
      "DJ aller Klassenpartys",
      "Sticker-Königin",
      "schläft im Bio-Unterricht",
      "organisiert alles",
      "war NIE krank",
    ][i],
    createdAt: ts(38 - i),
  }));
  db.users.push(...classmates);
  const U = (i: number) => classmates[i].id;

  db.invites.push({
    code: "MATURA26",
    label: "Klassen-Code 2026",
    active: true,
    createdBy: admin.id,
    createdAt: ts(40),
  });

  db.stickers.push(
    ...["⭐", "🔥", "💯", "👑", "💀", "🫶"].map((emoji) => ({
      id: id(),
      label: emoji,
      emoji,
    })),
  );

  const post = (p: Partial<(typeof db.posts)[number]> & { authorId: string }) => {
    const full = {
      id: id(),
      type: "moment" as const,
      category: "bilder" as const,
      visibility: "public" as const,
      media: [],
      taggedUserIds: [],
      tags: [],
      nominatedForYearbook: false,
      pinned: false,
      draft: false,
      reportCount: 0,
      createdAt: ts(10),
      ...p,
    };
    db.posts.push(full as (typeof db.posts)[number]);
    return full.id;
  };

  // Lehrerzitate
  const q1 = post({
    authorId: U(4),
    type: "lehrerzitat",
    category: "lehrer",
    title: "Herr Steinmann, Mathe",
    body: "«Das kommt sicher nicht an der Prüfung.» — kam an der Prüfung.",
    tags: ["legendär", "unterricht"],
    year: "3. Klasse",
    pinned: true,
    nominatedForYearbook: true,
    createdAt: ts(3),
  });
  post({
    authorId: U(1),
    type: "lehrerzitat",
    category: "lehrer",
    body: "«Handys weg — ausser ihr googelt die Lösung.»",
    tags: ["lustig"],
    visibility: "anon",
    createdAt: ts(5),
  });
  post({
    authorId: U(7),
    type: "zitat",
    category: "zitate",
    title: "Mia, im Skilager",
    body: "«Ich kann nicht Ski fahren, ich kann nur fallen mit Stil.»",
    taggedUserIds: [U(2)],
    tags: ["skilager", "iconic"],
    year: "4. Klasse",
    event: "Skilager Davos",
    nominatedForYearbook: true,
    createdAt: ts(2),
  });

  // Reisebilder
  post({
    authorId: U(3),
    type: "reisebild",
    category: "reisen",
    title: "Abschlussreise Lissabon",
    body: "Sonnenuntergang am letzten Abend 🌅",
    media: [
      { id: id(), url: ph("Lissabon 🌅", "green"), originalUrl: ph("Lissabon", "green") },
    ],
    taggedUserIds: [U(0), U(3), U(5)],
    tags: ["abschlussreise", "wholesome"],
    year: "Abschlussjahr",
    event: "Lissabon 2026",
    pinned: true,
    nominatedForYearbook: true,
    createdAt: ts(1),
  });
  post({
    authorId: U(8),
    type: "reisebild",
    category: "reisen",
    title: "Skilager Davos",
    media: [{ id: id(), url: ph("Davos ⛷️", "blue"), originalUrl: ph("Davos", "blue") }],
    tags: ["skilager", "throwback"],
    year: "4. Klasse",
    event: "Skilager Davos",
    createdAt: ts(20),
  });

  // Memes / Insider
  post({
    authorId: U(1),
    type: "meme",
    category: "insider-memes",
    title: "Wenn die Stellvertretung kommt",
    media: [
      {
        id: id(),
        url: ph("POV: Freistunde 😎", "pink"),
        originalUrl: ph("meme", "pink"),
        overlays: [
          {
            kind: "text",
            id: id(),
            text: "POV: Freistunde",
            style: "tiktok",
            x: 0.5,
            y: 0.18,
            rotation: -3,
            scale: 1,
          },
        ],
      },
    ],
    tags: ["cursed", "running-gag"],
    visibility: "anon",
    createdAt: ts(4),
  });

  // Honorable mention
  post({
    authorId: admin.id,
    type: "honorable-mention",
    category: "honorable-mentions",
    title: "Most iconic: Luca's Referat-Crash",
    body: "PowerPoint abgestürzt → Referat trotzdem aus dem Kopf gehalten. Legende.",
    taggedUserIds: [U(3)],
    tags: ["legendär", "iconic"],
    nominatedForYearbook: true,
    createdAt: ts(6),
  });

  // Idee
  post({
    authorId: U(0),
    type: "idee",
    category: "ideen",
    title: "Doppelseite: „Damals vs. Heute“",
    body: "Erstes Schulfoto neben aktuellem Bild von jeder Person. Wer ist dabei?",
    tags: ["throwback"],
    createdAt: ts(7),
  });

  // Personen / Portraits
  post({
    authorId: U(2),
    type: "bild",
    category: "personen",
    title: "Portrait Sophie",
    media: [{ id: id(), url: ph("Sophie 📸", "yellow"), originalUrl: ph("Sophie", "yellow") }],
    taggedUserIds: [U(4)],
    tags: ["wholesome"],
    createdAt: ts(8),
  });
  post({
    authorId: U(5),
    type: "story",
    category: "personen",
    title: "Typisch Nico",
    body: "Hat im Bio-Test eingeschlafen und trotzdem eine 5 geschrieben.",
    taggedUserIds: [U(5)],
    tags: ["lustig", "legendär"],
    visibility: "anon",
    createdAt: ts(9),
  });

  // A collaborative collection
  const col: (typeof db.collections)[number] = {
    id: id(),
    name: "Beste Lehrerzitate",
    description: "Sammlung fürs Heft – Doppelseite Lehrer.",
    ownerId: admin.id,
    memberIds: [U(4), U(1)],
    isPublic: true,
    coverPostId: q1,
    createdAt: ts(5),
  };
  db.collections.push(col);
  db.collectionItems.push({
    id: id(),
    collectionId: col.id,
    postId: q1,
    status: "fast-sicher",
    addedBy: admin.id,
    createdAt: ts(4),
  });

  // A few reactions / nominations to make counts non-zero
  for (const pst of db.posts.slice(0, 6)) {
    const fans = classmates.slice(0, 3 + (pst.title?.length ?? 0) % 5);
    for (const f of fans) {
      db.reactions.push({ id: id(), postId: pst.id, userId: f.id, emoji: "like" });
    }
  }
  db.comments.push({
    id: id(),
    postId: q1,
    authorId: U(1),
    body: "ALTER das ist so wahr 😂😂",
    anon: false,
    createdAt: ts(2),
  });

  return db;
}
