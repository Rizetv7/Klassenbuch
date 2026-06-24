import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listPosts } from "@/lib/repo";
import { ROOMS, CATEGORIES, ACCENTS, roomMeta } from "@/lib/constants";
import { PostCard } from "@/components/PostCard";
import { Masonry } from "@/components/Masonry";
import type { CategoryId, RoomId } from "@/lib/types";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return ROOMS.map((r) => ({ room: r.id }));
}

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ room: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { room } = await params;
  const { category } = await searchParams;
  const meta = roomMeta(room as RoomId);
  if (!meta) notFound();

  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";
  const posts = await listPosts(user, {
    room: meta.id,
    category: (category as CategoryId) || undefined,
    sort: "new",
  });
  const cats = CATEGORIES.filter((c) => c.room === meta.id);

  return (
    <div className="space-y-5">
      <section
        className="relative overflow-hidden rounded-card p-6 text-white shadow-soft"
        style={{ background: ACCENTS[meta.accent] }}
      >
        <span className="absolute right-4 top-2 text-7xl opacity-30">{meta.emoji}</span>
        <p className="font-hand text-2xl opacity-90">Matura Campus</p>
        <h1 className="font-display text-3xl font-extrabold">{meta.emoji} {meta.name}</h1>
        <p className="mt-1 max-w-md opacity-90">{meta.tagline}</p>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href={`/rooms/${meta.id}`} className="chip" data-active={!category}>
          Alles im Raum
        </Link>
        {cats.map((c) => (
          <Link key={c.id} href={`/rooms/${meta.id}?category=${c.id}`} className="chip" data-active={category === c.id}>
            {c.emoji} {c.name}
          </Link>
        ))}
      </div>

      <p className="text-sm text-ink-soft">{posts.length} Beiträge</p>
      <Masonry>
        {posts.map((p) => (
          <PostCard key={p.id} post={p} isAdmin={isAdmin} />
        ))}
      </Masonry>
      {posts.length === 0 && (
        <p className="rounded-card border border-dashed border-ink-soft p-8 text-center text-ink-soft">
          Hier ist noch nichts. <Link href="/upload" className="font-bold text-pink underline">Beitragen?</Link>
        </p>
      )}
    </div>
  );
}
