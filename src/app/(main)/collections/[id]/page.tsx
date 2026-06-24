import { notFound } from "next/navigation";
import { Users, Lock, Layers } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getCollection } from "@/lib/collections";
import { getUserPublic } from "@/lib/repo";
import { Avatar } from "@/components/Avatar";
import { PostCard } from "@/components/PostCard";
import { CollectionItemControls } from "@/components/CollectionItemControls";

export const dynamic = "force-dynamic";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const col = await getCollection(user, id);
  if (!col) notFound();
  const owner = await getUserPublic(col.ownerId);
  const isAdmin = user?.role === "admin";

  // status summary
  const counts: Record<string, number> = {};
  for (const it of col.items) if (it.status) counts[it.status] = (counts[it.status] ?? 0) + 1;

  return (
    <div className="space-y-5">
      <section className="rounded-card border border-paper-2 bg-white p-5 shadow-soft">
        <h1 className="font-display text-2xl font-extrabold">{col.name}</h1>
        {col.description && <p className="mt-1 text-ink-soft">{col.description}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
          {owner && (
            <span className="flex items-center gap-1.5">
              <Avatar user={owner} size={22} /> {owner.name}
            </span>
          )}
          <span className="flex items-center gap-1"><Layers size={14} /> {col.itemCount} Beiträge</span>
          {col.memberIds.length > 0 && (
            <span className="flex items-center gap-1"><Users size={14} /> {col.memberIds.length + 1} Mitwirkende</span>
          )}
          {!col.isPublic && <span className="flex items-center gap-1"><Lock size={14} /> privat</span>}
        </div>
        {Object.keys(counts).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {counts["favorit"] && <span className="chip">⭐ {counts["favorit"]} Favoriten</span>}
            {counts["fast-sicher"] && <span className="chip">✅ {counts["fast-sicher"]} fast sicher</span>}
            {counts["braucht-kontext"] && <span className="chip">❓ {counts["braucht-kontext"]} braucht Kontext</span>}
            {counts["loeschen?"] && <span className="chip">🗑️ {counts["loeschen?"]} zu privat?</span>}
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {col.items.map((it) =>
          it.post ? (
            <div key={it.id}>
              <PostCard post={it.post} isAdmin={isAdmin} flat />
              {col.canEdit && (
                <CollectionItemControls collectionId={col.id} itemId={it.id} status={it.status} />
              )}
            </div>
          ) : null,
        )}
      </div>

      {col.items.length === 0 && (
        <p className="rounded-card border border-dashed border-ink-soft p-8 text-center text-ink-soft">
          Leer. Speichere Beiträge über das 🔖-Symbol in diese Sammlung.
        </p>
      )}
    </div>
  );
}
