import { getCurrentUser } from "@/lib/session";
import { listPosts } from "@/lib/repo";
import { TIMELINE_YEARS } from "@/lib/constants";
import { PostCard } from "@/components/PostCard";
import { Masonry } from "@/components/Masonry";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";
  const posts = await listPosts(user, { sort: "new" });

  const buckets = TIMELINE_YEARS.map((y) => ({
    year: y,
    posts: posts.filter((p) => p.year === y),
  })).filter((b) => b.posts.length > 0);
  const undated = posts.filter((p) => !p.year);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-extrabold">🕰️ Zeitstrahl</h1>
      <p className="-mt-4 text-ink-soft">Unsere Jahre, von der 1. Klasse bis zum Abschluss.</p>

      {buckets.map((b) => (
        <section key={b.year} className="relative border-l-4 border-ink/15 pl-5">
          <span className="absolute -left-[11px] top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-paper">●</span>
          <h2 className="mb-3 font-display text-xl font-extrabold">{b.year}</h2>
          <Masonry>
            {b.posts.map((p) => (
              <PostCard key={p.id} post={p} isAdmin={isAdmin} />
            ))}
          </Masonry>
        </section>
      ))}

      {undated.length > 0 && (
        <section className="border-l-4 border-dashed border-ink/15 pl-5">
          <h2 className="mb-3 font-display text-xl font-extrabold text-ink-soft">Ohne Jahr</h2>
          <Masonry>
            {undated.map((p) => (
              <PostCard key={p.id} post={p} isAdmin={isAdmin} />
            ))}
          </Masonry>
        </section>
      )}
    </div>
  );
}
