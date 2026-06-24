"use client";

import { useEffect, useState } from "react";
import { Plus, Copy } from "lucide-react";
import { apiPost, apiPatch } from "@/lib/api";

interface Invite {
  code: string;
  label: string;
  active: boolean;
}

export function AdminInvites() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");

  async function load() {
    const r = await fetch("/api/admin/invites");
    if (r.ok) setInvites((await r.json()).invites ?? []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!code.trim()) return;
    await apiPost("/api/admin/invites", { code, label }).catch(() => {});
    setCode(""); setLabel("");
    load();
  }
  async function toggle(c: Invite) {
    await apiPatch("/api/admin/invites", { code: c.code, active: !c.active }).catch(() => {});
    load();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE" className="kb-input w-32 uppercase tracking-widest" />
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Bezeichnung" className="kb-input flex-1" />
        <button onClick={create} className="sticker-btn flex items-center gap-1.5 bg-ink px-4 text-paper">
          <Plus size={16} /> Code
        </button>
      </div>
      <div className="space-y-2">
        {invites.map((c) => (
          <div key={c.code} className="flex items-center gap-3 rounded-xl border border-paper-2 bg-white p-3">
            <span className="font-display text-lg font-extrabold tracking-widest">{c.code}</span>
            <button onClick={() => navigator.clipboard?.writeText(c.code)} className="text-ink-soft hover:text-ink" title="Kopieren">
              <Copy size={14} />
            </button>
            <span className="text-sm text-ink-soft">{c.label}</span>
            <button
              onClick={() => toggle(c)}
              className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${c.active ? "bg-green/20 text-green" : "bg-red-100 text-red-600"}`}
            >
              {c.active ? "aktiv" : "gesperrt"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
