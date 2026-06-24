import Link from "next/link";
import { Plus, Compass, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { listPosts, listClassmates } from "@/lib/repo";
import { ROOMS, ACCENTS } from "@/lib/constants";
import { PostCard } from "@/components/PostCard";
import { Masonry } from "@/components/Masonry";
import { tilt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";
  const posts = await listPosts(user, { sort: "new" });
  const classmates = await listClassmates();

  // a quote to spotlight
  const quotes = posts.filter((p) => p.type === "zitat" || p.type === "lehrerzitat");
  const spotlight = quotes.find((q) => q.pinned) ?? quotes[0];

  const top = [...posts]
    .sort((a, b) => b.likeCount + b.nominationCount * 2 - (a.likeCount + a.nominationCount * 2))
    .slice(0, 6);

  // "Wer fehlt noch?" — classmates without a portrait in Personen
  const portraitOf = new Set<string>();
  for (const p of posts)
    if (p.category === "personen") p.taggedUserIds.forEach((u) => portraitOf.add(u));
  const missing = classmates.filter((c) => !portraitOf.has(c.id));
  const have = classmates.length - missing.length;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-card border border-paper-2 bg-white px-5 py-8 text-center shadow-soft sm:py-10">
        <div className="pointer-events-none absolute left-4 top-4 text-3xl rotate-[-12deg] opacity-70">📸</div>
        <div className="pointer-events-none absolute right-5 top-6 text-3xl rotate-[10deg] opacity-70">💬</div>
        <div className="pointer-events-none absolute bottom-4 left-10 text-2xl rotate-[8deg] opacity-60">✨</div>
        <div className="pointer-events-none absolute bottom-6 right-8 text-2xl rotate-[-8deg] opacity-60">🎓</div>

        <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          Sammle alles, was in unsere{" "}
          <span className="text-pink">Maturazeitung</span> gehört
        </h1>
        <p className="mx-auto mt-2 max-w-md text-ink-soft">
          Bilder, Zitate, Insider, Reisen, Sticker & Ideen — an einem Ort.
          Liken, kommentieren, gemeinsam basteln.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link href="/upload" className="sticker-btn flex items-center gap-2 bg-pink px-6 py-3 text-white">
            <Plus size={18} /> Moment einsenden
          </Link>
          <Link href="/explore" className="sticker-btn flex items-center gap-2 bg-white px-6 py-3">
            <Compass size={18} /> Durchstöbern
          </Link>
        </div>
      </section>

      {/* Spotlight quote */}
      {spotlight && (
        <section
          className="relative rounded-card bg-ink px-6 py-8 text-center text-paper shadow-soft"
          style={{ rotate: "-0.6deg" }}
        >
          <span className="absolute left-4 top-3 font-display text-5xl opacity-30">“</span>
          <Link href={`/post/${spotlight.id}`}>
            <p className="mx-auto max-w-2xl font-display text-2xl font-bold leading-snug sm:text-3xl">
              {spotlight.body}
            </p>
          </Link>
          {spotlight.title && (
            <p className="mt-3 font-hand text-2xl text-yellow">— {spotlight.title}</p>
          )}
          <p className="mt-2 text-xs opacity-70">
            ❤️ {spotlight.likeCount} · 💬 {spotlight.commentCount} · ✨ {spotlight.nominationCount}
          </p>
        </section>
      )}

      {/* Rooms as playful islands */}
      <section>
        <h2 className="mb-3 font-display text-xl font-extrabold">Matura Campus</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ROOMS.map((r, i) => (
            <Link
              key={r.id}
              href={`/rooms/${r.id}`}
              className="group relative overflow-hidden rounded-card border border-paper-2 bg-white p-4 shadow-soft transition hover:-translate-y-1"
              style={{ rotate: `${tilt(r.id, 1.6)}deg` }}
            >
              <span
                className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 transition group-hover:scale-150"
                style={{ background: ACCENTS[r.accent] }}
              />
              <span className="text-3xl">{r.emoji}</span>
              <p className="mt-2 font-display font-bold leading-tight">{r.name}</p>
              <p className="text-xs text-ink-soft">{r.tagline}</p>
              {i === 0 && <span className="tape -top-2 left-6 rotate-[-6deg]" />}
            </Link>
          ))}
        </div>
      </section>

      {/* Wer fehlt noch */}
      {classmates.length > 0 && (
        <section className="rounded-card border border-dashed border-ink-soft bg-paper-2/40 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold">Wer fehlt noch? 🪪</h2>
            <span className="text-sm font-bold text-ink-soft">
              {have}/{classmates.length} Portraits
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-green transition-all"
              style={{ width: `${classmates.length ? (have / classmates.length) * 100 : 0}%` }}
            />
          </div>
          {missing.length > 0 && (
            <p className="mt-2 text-sm text-ink-soft">
              Noch ohne Portrait:{" "}
              {missing.slice(0, 8).map((m, i) => (
                <span key={m.id}>
                  {i > 0 && ", "}
                  <Link href={`/profile/${m.id}`} className="font-semibold text-blue hover:underline">
                    {m.nickname || m.name.split(" ")[0]}
                  </Link>
                </span>
              ))}
              {missing.length > 8 && ` +${missing.length - 8}`}
            </p>
          )}
        </section>
      )}

      {/* Highlights der Woche */}
      {top.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold">
            <Sparkles size={18} className="text-yellow" /> Highlights der Woche
          </h2>
          <Masonry>
            {top.map((p) => (
              <PostCard key={p.id} post={p} isAdmin={isAdmin} />
            ))}
          </Masonry>
        </section>
      )}

      {/* The Memory Wall */}
      <section>
        <h2 className="mb-3 font-display text-xl font-extrabold">Memory Wall</h2>
        <Masonry>
          {posts.map((p) => (
            <PostCard key={p.id} post={p} isAdmin={isAdmin} />
          ))}
        </Masonry>
        {posts.length === 0 && (
          <p className="rounded-card border border-dashed border-ink-soft p-8 text-center text-ink-soft">
            Noch nichts hier. Sei die erste Person und{" "}
            <Link href="/upload" className="font-bold text-pink underline">
              lade etwas hoch
            </Link>
            !
          </p>
        )}
      </section>
    </div>
  );
}
