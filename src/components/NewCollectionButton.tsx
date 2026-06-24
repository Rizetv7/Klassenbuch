"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { apiPost } from "@/lib/api";

export function NewCollectionButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  async function create() {
    if (!name.trim()) return;
    const { collection } = await apiPost<{ collection: { id: string } }>("/api/collections", {
      name: name.trim(),
      description: desc.trim(),
      isPublic,
    });
    setOpen(false);
    router.push(`/collections/${collection.id}`);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="sticker-btn flex items-center gap-1.5 bg-ink px-4 py-2 text-sm text-paper">
        <Plus size={16} /> Neue Sammlung
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="card-paper w-full max-w-md space-y-3 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-extrabold">Neue Sammlung</h3>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (z. B. „Lehrer-Doppelseite“)" className="kb-input" autoFocus />
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Wofür ist diese Sammlung?" className="kb-input" />
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              Öffentlich (alle können sehen & mitsammeln)
            </label>
            <div className="flex gap-2">
              <button onClick={create} className="sticker-btn bg-pink px-4 py-2 text-sm text-white">Erstellen</button>
              <button onClick={() => setOpen(false)} className="sticker-btn bg-white px-4 py-2 text-sm">Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
