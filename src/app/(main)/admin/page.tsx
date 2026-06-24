import { redirect } from "next/navigation";
import { Shield, Flag, KeyRound, BarChart3 } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDB } from "@/lib/db";
import { toPostView } from "@/lib/repo";
import { AdminInvites } from "@/components/AdminInvites";
import { PostCard } from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/join");
  if (user.role !== "admin") redirect("/");

  const db = await getDB();
  const reported = db.posts
    .filter((p) => (p.reportCount ?? 0) > 0)
    .map((p) => toPostView(db, p, user));

  const stats = {
    posts: db.posts.length,
    users: db.users.filter((u) => u.isClassmate).length,
    comments: db.comments.length,
    nominated: db.posts.filter(
      (p) => p.nominatedForYearbook || db.reactions.some((r) => r.postId === p.id && r.emoji === "nominate"),
    ).length,
  };

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold">
        <Shield /> Admin · Redaktion
      </h1>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Beiträge", value: stats.posts },
          { label: "Personen", value: stats.users },
          { label: "Kommentare", value: stats.comments },
          { label: "Fürs Heft", value: stats.nominated },
        ].map((s) => (
          <div key={s.label} className="card-paper p-4 text-center">
            <p className="font-display text-3xl font-extrabold">{s.value}</p>
            <p className="text-xs font-semibold text-ink-soft">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="card-paper p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-extrabold">
          <KeyRound size={18} /> Einladungs-Codes
        </h2>
        <AdminInvites />
      </section>

      <section className="card-paper p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-extrabold">
          <Flag size={18} /> Gemeldete Beiträge
        </h2>
        {reported.length === 0 ? (
          <p className="text-sm text-ink-soft">Nichts gemeldet. 🌱 Bei anonymen Beiträgen siehst du als Admin die Person.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {reported.map((p) => (
              <PostCard key={p.id} post={p} isAdmin flat />
            ))}
          </div>
        )}
      </section>

      <section className="card-paper p-5 text-sm text-ink-soft">
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <BarChart3 size={18} /> Moderation
        </h2>
        <p>
          Du kannst jeden Beitrag direkt auf der Karte löschen oder anpinnen (die
          Buttons erscheinen nur für dich). Nichts muss vorab freigegeben werden —
          alles ist sofort sichtbar.
        </p>
      </section>
    </div>
  );
}
