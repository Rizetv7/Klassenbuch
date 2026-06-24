import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { createCollection, listCollections } from "@/lib/collections";

export async function GET() {
  const user = await getCurrentUser();
  const collections = await listCollections(user);
  return NextResponse.json({ collections });
}

const schema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional(),
  isPublic: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Ungültig" }, { status: 400 });
  const collection = await createCollection(
    user,
    parsed.data.name,
    parsed.data.description ?? "",
    parsed.data.isPublic,
  );
  return NextResponse.json({ ok: true, collection });
}
