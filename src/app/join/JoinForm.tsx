"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { compressImage } from "@/lib/imageClient";

type Tab = "join" | "recover";

export function JoinForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("join");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // join fields
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  // recover fields
  const [rName, setRName] = useState("");
  const [rPass, setRPass] = useState("");

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const small = await compressImage(file, 400);
    const fd = new FormData();
    fd.append("files", small, file.name);
    // upload needs a session — for join we instead inline as data URL preview;
    // real upload happens after account exists, so just preview here.
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(small);
  }

  async function submitJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          nickname,
          passphrase: passphrase || undefined,
          // data-URL avatar is fine for SVG/small images; otherwise fall back to initials
          avatarUrl: avatarUrl && avatarUrl.length < 200000 ? avatarUrl : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }

  async function submitRecover(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recover: true, name: rName, passphrase: rPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-paper p-5">
      <div className="mb-4 flex rounded-full bg-paper-2 p-1 text-sm font-bold">
        <button
          onClick={() => setTab("join")}
          className={`flex-1 rounded-full py-2 ${tab === "join" ? "bg-ink text-paper" : "text-ink-soft"}`}
        >
          Neu dabei
        </button>
        <button
          onClick={() => setTab("recover")}
          className={`flex-1 rounded-full py-2 ${tab === "recover" ? "bg-ink text-paper" : "text-ink-soft"}`}
        >
          Schon dabei?
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {tab === "join" ? (
        <form onSubmit={submitJoin} className="space-y-3">
          <Field label="Klassen-Code">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="z. B. MATURA26"
              className="kb-input tracking-widest uppercase"
            />
          </Field>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative shrink-0"
              title="Profilbild wählen"
            >
              <Avatar user={{ name: name || "Du", avatarUrl }} size={56} ring />
              <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-pink text-xs text-white shadow">
                ＋
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickAvatar} />
            <div className="flex-1">
              <Field label="Dein Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Vorname Nachname"
                  className="kb-input"
                />
              </Field>
            </div>
          </div>

          <Field label="Spitzname (optional)">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="wie dich alle nennen"
              className="kb-input"
            />
          </Field>

          <Field label="Passwort für Wiederanmeldung (optional)">
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="falls du das Gerät wechselst"
              className="kb-input"
            />
          </Field>

          <button
            disabled={loading}
            className="sticker-btn w-full bg-pink py-3 text-white disabled:opacity-60"
          >
            {loading ? "Moment…" : "Los geht's 🎉"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitRecover} className="space-y-3">
          <Field label="Dein Name">
            <input value={rName} onChange={(e) => setRName(e.target.value)} required className="kb-input" />
          </Field>
          <Field label="Passwort">
            <input
              type="password"
              value={rPass}
              onChange={(e) => setRPass(e.target.value)}
              required
              className="kb-input"
            />
          </Field>
          <button
            disabled={loading}
            className="sticker-btn w-full bg-ink py-3 text-paper disabled:opacity-60"
          >
            {loading ? "Moment…" : "Anmelden"}
          </button>
          <p className="text-xs text-ink-soft">
            Funktioniert nur, wenn du beim Beitreten ein Passwort gesetzt hast.
          </p>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      {children}
    </label>
  );
}
