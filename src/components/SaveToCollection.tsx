"use client";

import { useEffect, useState } from "react";
import { X, Plus, Check, Layers } from "lucide-react";
import { apiPost } from "@/lib/api";

interface Col {
  id: string;
  name: string;
  itemCount: number;
  canEdit: boolean;
}

export function SaveToCollection({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const [cols, setCols] = useState<Col[] | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("/api/collections")
      .then((r) => r.json())
      .then((d) => setCols(d.collections ?? []))
      .catch(() => setCols([]));
  }, []);

  async function add(cid: string) {
    setAdded((s) => new Set(s).add(cid));
    await apiPost(`/api/collections/${cid}/items`, { postId }).catch(() => {});
  }

  async function create() {
    if (!name.trim()) return;
    const { collection } = await apiPost<{ collection: Col }>("/api/collections", {
      name: name.trim(),
      isPublic: true,
    });
    await add(collection.id);
    setCols((c) => [{ ...collection, itemCount: 1, canEdit: true }, ...(c ?? [])]);
    setName("");
    setCreating(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="card-paper w-full max-w-sm p-4 sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold">
            <Layers size={18} /> In Sammlung speichern
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-paper-2">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-64 space-y-1 overflow-y-auto">
          {cols === null && <p className="text-sm text-ink-soft">Lädt…</p>}
          {cols?.filter((c) => c.canEdit).length === 0 && (
            <p className="text-sm text-ink-soft">Noch keine eigenen Sammlungen.</p>
          )}
          {cols
            ?.filter((c) => c.canEdit)
            .map((c) => (
              <button
                key={c.id}
                onClick={() => add(c.id)}
                disabled={added.has(c.id)}
                className="flex w-full items-center justify-between rounded-xl border border-paper-2 px-3 py-2 text-left hover:border-ink disabled:opacity-60"
              >
                <span className="font-semibold">{c.name}</span>
                {added.has(c.id) ? (
                  <Check size={16} className="text-green" />
                ) : (
                  <Plus size={16} />
                )}
              </button>
            ))}
        </div>

        {creating ? (
          <div className="mt-3 flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              placeholder="Name der Sammlung"
              className="flex-1 rounded-full border border-paper-2 px-3 py-2 text-sm outline-none focus:border-ink"
            />
            <button onClick={create} className="sticker-btn bg-ink px-4 text-sm text-paper">
              OK
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-ink-soft py-2 text-sm font-semibold hover:bg-paper-2"
          >
            <Plus size={16} /> Neue Sammlung
          </button>
        )}
      </div>
    </div>
  );
}
