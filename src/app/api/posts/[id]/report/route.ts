import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { mutate, id as newId, now } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  await mutate((db) => {
    const post = db.posts.find((p) => p.id === id);
    if (!post) return;
    post.reportCount = (post.reportCount ?? 0) + 1;
    // notify all admins
    for (const admin of db.users.filter((u) => u.role === "admin")) {
      db.notifications.push({
        id: newId(),
        userId: admin.id,
        type: "system",
        text: `Ein Beitrag wurde gemeldet`,
        href: `/post/${id}`,
        read: false,
        createdAt: now(),
      });
    }
  });
  return NextResponse.json({ ok: true });
}
