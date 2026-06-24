import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDB, mutate, id, now } from "@/lib/db";
import { createSession } from "@/lib/session";
import type { User } from "@/lib/types";

const joinSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(2).max(40),
  nickname: z.string().max(30).optional(),
  bio: z.string().max(200).optional(),
  avatarUrl: z.string().optional(),
  passphrase: z.string().max(100).optional(),
});

const recoverSchema = z.object({
  name: z.string().min(1),
  passphrase: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // Recover an existing account on a new device via name + passphrase.
  if (body?.recover) {
    const parsed = recoverSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Ungültig" }, { status: 400 });
    const db = await getDB();
    const user = db.users.find(
      (u) => u.name.toLowerCase() === parsed.data.name.trim().toLowerCase() && u.passHash,
    );
    if (!user || !bcrypt.compareSync(parsed.data.passphrase, user.passHash!)) {
      return NextResponse.json({ error: "Name oder Passwort stimmt nicht." }, { status: 401 });
    }
    await createSession(user.id);
    return NextResponse.json({ ok: true, user: { id: user.id } });
  }

  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte fülle alle Felder korrekt aus." }, { status: 400 });
  }
  const { code, name, nickname, bio, avatarUrl, passphrase } = parsed.data;

  const db = await getDB();
  const invite = db.invites.find((i) => i.code.toLowerCase() === code.trim().toLowerCase());
  if (!invite || !invite.active) {
    return NextResponse.json({ error: "Dieser Code ist ungültig oder gesperrt." }, { status: 403 });
  }

  const user: User = {
    id: id(),
    name: name.trim(),
    nickname: nickname?.trim() || undefined,
    bio: bio?.trim() || undefined,
    avatarUrl: avatarUrl || `/api/avatar/${encodeURIComponent(name.trim())}`,
    role: "member",
    passHash: passphrase ? bcrypt.hashSync(passphrase, 8) : undefined,
    isClassmate: true,
    createdAt: now(),
  };
  await mutate((d) => d.users.push(user));
  await createSession(user.id);
  return NextResponse.json({ ok: true, user: { id: user.id } });
}
