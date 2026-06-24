import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { toggleReaction } from "@/lib/repo";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { emoji } = await req.json().catch(() => ({ emoji: "like" }));
  await toggleReaction(user.id, id, String(emoji || "like"));
  return NextResponse.json({ ok: true });
}
