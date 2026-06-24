import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getDB, mutate } from "@/lib/db";
import { deletePost, setPinned } from "@/lib/repo";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const db = await getDB();
  const post = db.posts.find((p) => p.id === id);
  if (!post) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const isOwner = post.authorId === user.id;
  const isAdmin = user.role === "admin";

  if (typeof body.pinned === "boolean") {
    if (!isAdmin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    await setPinned(id, body.pinned);
  }
  if ((isOwner || isAdmin) && (body.title !== undefined || body.body !== undefined || body.tags || body.category || body.visibility)) {
    await mutate((d) => {
      const p = d.posts.find((x) => x.id === id)!;
      if (body.title !== undefined) p.title = body.title;
      if (body.body !== undefined) p.body = body.body;
      if (body.tags) p.tags = body.tags;
      if (body.category) p.category = body.category;
      if (body.visibility) p.visibility = body.visibility;
      if (body.media) p.media = body.media;
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const db = await getDB();
  const post = db.posts.find((p) => p.id === id);
  if (!post) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (post.authorId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  await deletePost(id);
  return NextResponse.json({ ok: true });
}
