import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { createPost, listPosts } from "@/lib/repo";
import type { CategoryId, Media, PostType, Visibility } from "@/lib/types";

const overlaySchema = z.union([
  z.object({
    kind: z.literal("text"),
    id: z.string(),
    text: z.string(),
    style: z.string(),
    x: z.number(),
    y: z.number(),
    rotation: z.number(),
    scale: z.number(),
    color: z.string().optional(),
  }),
  z.object({
    kind: z.literal("sticker"),
    id: z.string(),
    sticker: z.string(),
    x: z.number(),
    y: z.number(),
    rotation: z.number(),
    scale: z.number(),
  }),
]);

const mediaSchema = z.object({
  id: z.string(),
  url: z.string(),
  originalUrl: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  overlays: z.array(overlaySchema).optional(),
});

const postSchema = z.object({
  type: z.string(),
  category: z.string(),
  visibility: z.enum(["public", "anon", "redaktion"]),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
  media: z.array(mediaSchema).default([]),
  taggedUserIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  year: z.string().optional(),
  event: z.string().optional(),
  draft: z.boolean().default(false),
  nominatedForYearbook: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const sp = req.nextUrl.searchParams;
  const posts = await listPosts(user, {
    category: (sp.get("category") as CategoryId) || undefined,
    type: sp.get("type") || undefined,
    tag: sp.get("tag") || undefined,
    personId: sp.get("person") || undefined,
    q: sp.get("q") || undefined,
    sort: (sp.get("sort") as "new" | "top" | "random") || undefined,
  });
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const parsed = postSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Daten", detail: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;
  const post = await createPost(user, {
    type: d.type as PostType,
    category: d.category as CategoryId,
    visibility: d.visibility as Visibility,
    title: d.title,
    body: d.body,
    media: d.media as Media[],
    taggedUserIds: d.taggedUserIds,
    tags: d.tags,
    year: d.year,
    event: d.event,
    draft: d.draft,
    nominatedForYearbook: d.nominatedForYearbook,
  });
  return NextResponse.json({ ok: true, post });
}
