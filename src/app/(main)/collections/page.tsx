import Link from "next/link";
import { Layers, Users, Lock } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { listCollections } from "@/lib/collections";
import { NewCollectionButton } from "@/components/NewCollectionButton";
import { tilt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const user = await getCurrentUser();
  const collections = await listCollections(user);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Sammlungen</h1>
          <p className="text-ink-soft">Beiträge bündeln — für Heft-Seiten, Favoriten, gemeinsam kuratieren.</p>
        </div>
        <NewCollectionButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link
            key={c.id}
            href={`/collections/${c.id}`}
            className="card-paper group overflow-hidden transition hover:-translate-y-1"
            style={{ rotate: `${tilt(c.id, 1.2)}deg` }}
          >
            <div className="relative h-28 bg-paper-2">
              {c.cover?.media[0] ? (
                <img src={c.cover.media[0].url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-4xl">
                  {c.cover?.body ? "💬" : "🗂️"}
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="font-display font-extrabold leading-tight">{c.name}</h2>
              {c.description && <p className="text-sm text-ink-soft line-clamp-2">{c.description}</p>}
              <div className="mt-2 flex items-center gap-3 text-xs font-semibold text-ink-soft">
                <span className="flex items-center gap-1"><Layers size={13} /> {c.itemCount}</span>
                {c.memberIds.length > 0 && <span className="flex items-center gap-1"><Users size={13} /> {c.memberIds.length + 1}</span>}
                {!c.isPublic && <span className="flex items-center gap-1"><Lock size={13} /> privat</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {collections.length === 0 && (
        <p className="rounded-card border border-dashed border-ink-soft p-8 text-center text-ink-soft">
          Noch keine Sammlungen. Erstelle die erste!
        </p>
      )}
    </div>
  );
}
