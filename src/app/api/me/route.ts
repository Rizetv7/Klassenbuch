import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { mutate } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { nickname, bio, avatarUrl } = await req.json().catch(() => ({}));
  await mutate((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (!u) return;
    if (nickname !== undefined) u.nickname = String(nickname).slice(0, 30) || undefined;
    if (bio !== undefined) u.bio = String(bio).slice(0, 200) || undefined;
    if (avatarUrl !== undefined && avatarUrl) u.avatarUrl = String(avatarUrl);
  });
  return NextResponse.json({ ok: true });
}
