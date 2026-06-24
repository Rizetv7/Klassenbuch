import "server-only";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { getDB, mutate, now } from "./db";
import { SESSION_COOKIE } from "./constants";
import type { PublicUser, User } from "./types";

export async function createSession(userId: string): Promise<string> {
  const token = nanoid(32);
  await mutate((db) => {
    db.sessions.push({ token, userId, createdAt: now() });
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await mutate((db) => {
      db.sessions = db.sessions.filter((s) => s.token !== token);
    });
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDB();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) ?? null;
}

export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    name: u.name,
    nickname: u.nickname,
    avatarUrl: u.avatarUrl,
    role: u.role,
    isClassmate: u.isClassmate,
  };
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
