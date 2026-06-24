import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { addToCollection } from "@/lib/collections";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { postId } = await req.json().catch(() => ({}));
  if (!postId) return NextResponse.json({ error: "postId fehlt" }, { status: 400 });
  try {
    await addToCollection(user, id, postId);
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
