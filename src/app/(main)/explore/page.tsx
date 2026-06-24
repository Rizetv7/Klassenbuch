import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";
import { listPosts } from "@/lib/repo";
import { FilterBar } from "@/components/FilterBar";
import { PostCard } from "@/components/PostCard";
import { Masonry } from "@/components/Masonry";
import type { CategoryId } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  const posts = await listPosts(user, {
    category: (sp.category as CategoryId) || undefined,
    type: sp.type,
    tag: sp.tag,
    personId: sp.person,
    q: sp.q,
    year: sp.year,
    event: sp.event,
    sort: (sp.sort as "new" | "top" | "random") || undefined,
  });

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-extrabold">Entdecken & Suchen</h1>
      <Suspense fallback={<div className="h-24" />}>
        <FilterBar />
      </Suspense>

      <p className="text-sm text-ink-soft">{posts.length} Beiträge</p>

      <Masonry>
        {posts.map((p) => (
          <PostCard key={p.id} post={p} isAdmin={isAdmin} />
        ))}
      </Masonry>
      {posts.length === 0 && (
        <p className="rounded-card border border-dashed border-ink-soft p-8 text-center text-ink-soft">
          Nichts gefunden. Andere Filter probieren?
        </p>
      )}
    </div>
  );
}
