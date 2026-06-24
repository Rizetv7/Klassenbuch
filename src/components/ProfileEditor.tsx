"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Avatar } from "./Avatar";
import { apiPatch } from "@/lib/api";
import { uploadFiles } from "@/lib/imageClient";

export function ProfileEditor({
  initial,
}: {
  initial: { name: string; nickname?: string; bio?: string; avatarUrl?: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(initial.nickname ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const [url] = await uploadFiles([f]);
    if (url) setAvatarUrl(url);
  }

  async function save() {
    setSaving(true);
    await apiPatch("/api/me", { nickname, bio, avatarUrl }).catch(() => {});
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="sticker-btn flex items-center gap-1.5 bg-white px-4 py-2 text-sm">
        <Pencil size={15} /> Profil bearbeiten
      </button>
    );
  }

  return (
    <div className="card-paper w-full max-w-md space-y-3 p-4">
      <div className="flex items-center gap-3">
        <button onClick={() => fileRef.current?.click()} className="relative">
          <Avatar user={{ name: initial.name, avatarUrl }} size={56} ring />
          <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-pink text-xs text-white">＋</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Spitzname" className="kb-input" />
      </div>
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} placeholder="Kurze Bio…" className="kb-input" />
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="sticker-btn bg-ink px-4 py-2 text-sm text-paper">
          {saving ? "Speichern…" : "Speichern"}
        </button>
        <button onClick={() => setOpen(false)} className="sticker-btn bg-white px-4 py-2 text-sm">
          Abbrechen
        </button>
      </div>
    </div>
  );
}
