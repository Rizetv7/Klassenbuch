import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDB } from "@/lib/db";
import { listPosts, getUserPublic } from "@/lib/repo";
import { Avatar } from "@/components/Avatar";
import { PostCard } from "@/components/PostCard";
import { Masonry } from "@/components/Masonry";
import { ProfileEditor } from "@/components/ProfileEditor";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getCurrentUser();
  const profile = await getUserPublic(id);
  if (!profile) notFound();

  const db = await getDB();
  const full = db.users.find((u) => u.id === id);
  const isMe = me?.id === id;
  const isAdmin = me?.role === "admin";

  const byThem = await listPosts(me, { authorId: id, sort: "new" });
  const aboutThem = (await listPosts(me, { personId: id, sort: "new" })).filter(
    (p) => p.authorId !== id,
  );
  const quotes = [...byThem, ...aboutThem].filter(
    (p) => p.type === "zitat" || p.type === "lehrerzitat",
  );

  // "typisch für diese Person" — most common tags across posts about them
  const tagCount = new Map<string, number>();
  for (const p of [...byThem, ...aboutThem])
    for (const t of p.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  const topTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* header */}
      <section className="relative overflow-hidden rounded-card border border-paper-2 bg-white p-5 shadow-soft">
        <span className="tape -top-2 left-10 rotate-[-5deg]" />
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Avatar user={profile} size={96} ring className="shrink-0" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-display text-2xl font-extrabold">{profile.name}</h1>
            {profile.nickname && <p className="font-hand text-2xl text-pink">„{profile.nickname}“</p>}
            {full?.bio && <p className="mt-1 text-ink-soft">{full.bio}</p>}
            {profile.role === "admin" && (
              <span className="mt-1 inline-block rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-paper">Redaktion</span>
            )}
            {topTags.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-bold uppercase text-ink-soft">Typisch</p>
                <div className="mt-1 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                  {topTags.map(([t, n]) => (
                    <Link key={t} href={`/explore?tag=${encodeURIComponent(t)}`} className="chip">
                      #{t} · {n}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {isMe ? (
                <ProfileEditor initial={{ name: profile.name, nickname: profile.nickname, bio: full?.bio, avatarUrl: profile.avatarUrl }} />
              ) : (
                <Link href={`/upload?person=${id}`} className="sticker-btn flex items-center gap-1.5 bg-pink px-4 py-2 text-sm text-white">
                  <Plus size={15} /> Etwas über {profile.name.split(" ")[0]} einsenden
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* quotes */}
      {quotes.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-extrabold">Beste Zitate 💬</h2>
          <Masonry>
            {quotes.map((p) => (
              <PostCard key={p.id} post={p} isAdmin={isAdmin} />
            ))}
          </Masonry>
        </section>
      )}

      {/* about them */}
      <section>
        <h2 className="mb-3 font-display text-xl font-extrabold">
          Über {profile.name.split(" ")[0]} · {aboutThem.length}
        </h2>
        {aboutThem.length > 0 ? (
          <Masonry>
            {aboutThem.map((p) => (
              <PostCard key={p.id} post={p} isAdmin={isAdmin} />
            ))}
          </Masonry>
        ) : (
          <p className="rounded-card border border-dashed border-ink-soft p-6 text-center text-ink-soft">
            Noch nichts. {!isMe && (
              <Link href={`/upload?person=${id}`} className="font-bold text-pink underline">Sei die erste Person!</Link>
            )}
          </p>
        )}
      </section>

      {/* by them */}
      {byThem.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-extrabold">Von {profile.name.split(" ")[0]} · {byThem.length}</h2>
          <Masonry>
            {byThem.map((p) => (
              <PostCard key={p.id} post={p} isAdmin={isAdmin} />
            ))}
          </Masonry>
        </section>
      )}
    </div>
  );
}
