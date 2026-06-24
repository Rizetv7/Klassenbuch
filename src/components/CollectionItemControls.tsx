"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { apiPatch, apiDelete } from "@/lib/api";
import type { CollectionItem } from "@/lib/types";

const STATUSES: { id: NonNullable<CollectionItem["status"]>; label: string }[] = [
  { id: "favorit", label: "⭐ Favorit" },
  { id: "fast-sicher", label: "✅ fast sicher" },
  { id: "braucht-kontext", label: "❓ braucht Kontext" },
  { id: "loeschen?", label: "🗑️ zu privat?" },
];

export function CollectionItemControls({
  collectionId,
  itemId,
  status,
}: {
  collectionId: string;
  itemId: string;
  status?: CollectionItem["status"];
}) {
  const router = useRouter();
  const [cur, setCur] = useState<string>(status ?? "");

  async function setStatus(s: string) {
    setCur(s);
    await apiPatch(`/api/collections/${collectionId}/items/${itemId}`, { status: s || undefined }).catch(() => {});
  }
  async function remove() {
    if (!confirm("Aus Sammlung entfernen?")) return;
    await apiDelete(`/api/collections/${collectionId}/items/${itemId}`).catch(() => {});
    router.refresh();
  }

  return (
    <div className="mt-1 flex items-center gap-1">
      <select
        value={cur}
        onChange={(e) => setStatus(e.target.value)}
        className="flex-1 rounded-full border border-paper-2 bg-white px-2 py-1 text-xs font-semibold"
      >
        <option value="">Status…</option>
        {STATUSES.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
      <button onClick={remove} className="rounded-full p-1.5 text-red-500 hover:bg-red-50">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
