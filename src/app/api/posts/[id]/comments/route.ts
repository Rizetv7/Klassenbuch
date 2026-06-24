import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { addComment, listComments } from "@/lib/repo";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const comments = await listComments(user, id);
  return NextResponse.json({ comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { body, anon, parentId } = await req.json().catch(() => ({}));
  if (!body || !String(body).trim())
    return NextResponse.json({ error: "Leer" }, { status: 400 });
  const comment = await addComment(user, id, String(body).trim(), !!anon, parentId);
  return NextResponse.json({ ok: true, comment });
}
