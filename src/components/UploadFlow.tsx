"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { ImagePlus, X, Pencil, Check, Hash } from "lucide-react";
import type { Overlay, PostType, PublicUser, Visibility } from "@/lib/types";
import {
  POST_TYPES,
  CATEGORIES,
  VISIBILITY_OPTIONS,
  TAG_SUGGESTIONS,
  TIMELINE_YEARS,
  postTypeMeta,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { ImageEditor } from "./ImageEditor";
import { uploadFiles } from "@/lib/imageClient";
import { apiPost } from "@/lib/api";

interface Img {
  localId: string;
  file: File;
  preview: string;
  overlays: Overlay[];
}

export function UploadFlow({
  classmates,
  preselectPerson,
}: {
  classmates: PublicUser[];
  preselectPerson?: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<PostType>("bild");
  const [images, setImages] = useState<Img[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [separate, setSeparate] = useState(true);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(postTypeMeta("bild").defaultCategory);
  const [people, setPeople] = useState<string[]>(preselectPerson ? [preselectPerson] : []);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [year, setYear] = useState("");
  const [event, setEvent] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [nominate, setNominate] = useState(false);
  const [draft, setDraft] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const meta = postTypeMeta(type);

  function chooseType(t: PostType) {
    setType(t);
    setCategory(postTypeMeta(t).defaultCategory);
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next: Img[] = [];
    for (const file of Array.from(list)) {
      if (!file.type.startsWith("image/")) continue;
      next.push({ localId: nanoid(6), file, preview: URL.createObjectURL(file), overlays: [] });
    }
    setImages((prev) => [...prev, ...next]);
  }

  function toggle<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }
  function addTag(t: string) {
    const clean = t.trim().replace(/^#/, "").toLowerCase();
    if (clean && !tags.includes(clean)) setTags([...tags, clean]);
    setTagInput("");
  }

  async function submit() {
    setError("");
    if (meta.needsImage && images.length === 0) {
      setError("Bitte mindestens ein Bild hinzufügen.");
      return;
    }
    if (!meta.needsImage && !body.trim() && !title.trim() && images.length === 0) {
      setError("Bitte etwas eingeben.");
      return;
    }
    setBusy(true);
    try {
      // upload images, preserving order → map to overlays
      let urls: string[] = [];
      if (images.length > 0) {
        urls = await uploadFiles(images.map((i) => i.file));
      }
      const media = images.map((img, i) => ({
        id: nanoid(8),
        url: urls[i],
        originalUrl: urls[i],
        overlays: img.overlays,
      }));

      const base = {
        type,
        category,
        visibility,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        taggedUserIds: people,
        tags,
        year: year || undefined,
        event: event.trim() || undefined,
        draft,
        nominatedForYearbook: nominate,
      };

      if (media.length > 1 && separate) {
        for (const m of media) {
          await apiPost("/api/posts", { ...base, media: [m] });
        }
      } else {
        await apiPost("/api/posts", { ...base, media });
      }

      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Speichern");
      setBusy(false);
    }
  }

  const editImg = images.find((i) => i.localId === editing);

  return (
    <div className="space-y-6">
      {/* Step 1: type */}
      <Section step={1} title="Was willst du einsenden?">
        <div className="flex flex-wrap gap-2">
          {POST_TYPES.map((t) => (
            <button key={t.id} onClick={() => chooseType(t.id)} className="chip" data-active={type === t.id}>
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
      </Section>

      {/* Step 2: media */}
      <Section step={2} title={meta.needsImage ? "Bilder" : "Bilder (optional)"}>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          className="cursor-pointer rounded-card border-2 border-dashed border-ink-soft/50 bg-white p-6 text-center hover:border-ink"
        >
          <ImagePlus className="mx-auto text-ink-soft" size={28} />
          <p className="mt-1 font-semibold">Bilder hierher ziehen oder klicken</p>
          <p className="text-xs text-ink-soft">Mehrere auf einmal möglich · werden automatisch verkleinert</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />

        {images.length > 0 && (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((img) => (
                <div key={img.localId} className="group relative aspect-square overflow-hidden rounded-xl bg-paper-2">
                  <img src={img.preview} alt="" className="h-full w-full object-cover" />
                  {img.overlays.length > 0 && (
                    <span className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white">✏️{img.overlays.length}</span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => setEditing(img.localId)} className="rounded-full bg-white p-2" title="Bearbeiten">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setImages((p) => p.filter((x) => x.localId !== img.localId))} className="rounded-full bg-white p-2 text-red-500">
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {images.length > 1 && (
              <label className="mt-2 flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={separate} onChange={(e) => setSeparate(e.target.checked)} />
                Jedes Bild als eigener Beitrag (sonst eine Galerie)
              </label>
            )}
          </>
        )}
      </Section>

      {/* Step 3: text */}
      <Section step={3} title="Beschreibung">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel / Wer? (optional)" className="kb-input" />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder={
            type === "zitat" || type === "lehrerzitat"
              ? "Das Zitat…"
              : type === "idee"
                ? "Deine Idee für die Zeitung…"
                : "Beschreibung / Story (optional)"
          }
          className="kb-input mt-2"
        />
        <div className="mt-2">
          <p className="mb-1 text-xs font-bold uppercase text-ink-soft">Kategorie</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)} className="chip" data-active={category === c.id}>
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Step 4: people & tags */}
      <Section step={4} title="Worum / um wen geht es?">
        <p className="mb-1 text-xs font-bold uppercase text-ink-soft">Personen markieren</p>
        <div className="flex flex-wrap gap-2">
          {classmates.map((c) => (
            <button
              key={c.id}
              onClick={() => setPeople((p) => toggle(p, c.id))}
              className={cn("flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-sm font-semibold", people.includes(c.id) ? "border-ink bg-ink text-paper" : "border-paper-2 bg-white")}
            >
              <Avatar user={c} size={22} />
              {c.nickname || c.name.split(" ")[0]}
              {people.includes(c.id) && <Check size={14} />}
            </button>
          ))}
        </div>

        <p className="mb-1 mt-4 text-xs font-bold uppercase text-ink-soft">Tags</p>
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((t) => (
            <span key={t} className="chip" data-active="true" onClick={() => setTags(tags.filter((x) => x !== t))}>
              #{t} <X size={12} />
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full border border-paper-2 bg-white px-2">
            <Hash size={14} className="text-ink-soft" />
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(tagInput))}
              placeholder="Tag…"
              className="w-24 bg-transparent py-1 text-sm outline-none"
            />
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TAG_SUGGESTIONS.filter((t) => !tags.includes(t)).slice(0, 8).map((t) => (
            <button key={t} onClick={() => addTag(t)} className="text-xs font-semibold text-blue hover:underline">+ {t}</button>
          ))}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-bold uppercase text-ink-soft">Schuljahr</p>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="kb-input">
              <option value="">—</option>
              {TIMELINE_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase text-ink-soft">Event / Ort</p>
            <input value={event} onChange={(e) => setEvent(e.target.value)} placeholder="z. B. Skilager Davos" className="kb-input" />
          </div>
        </div>
      </Section>

      {/* Step 5: visibility */}
      <Section step={5} title="Sichtbarkeit">
        <div className="grid gap-2 sm:grid-cols-3">
          {VISIBILITY_OPTIONS.map((v) => (
            <button
              key={v.id}
              onClick={() => setVisibility(v.id)}
              className={cn("rounded-card border p-3 text-left", visibility === v.id ? "border-ink bg-paper-2" : "border-paper-2 bg-white")}
            >
              <span className="text-xl">{v.emoji}</span>
              <p className="font-bold">{v.name}</p>
              <p className="text-xs text-ink-soft">{v.desc}</p>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={nominate} onChange={(e) => setNominate(e.target.checked)} />
            ✨ Für die Zeitung vorschlagen
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} />
            📝 Als Entwurf speichern (nur ich)
          </label>
        </div>
      </Section>

      {error && <p className="rounded-xl bg-red-100 px-3 py-2 font-semibold text-red-700">{error}</p>}

      <div className="sticky bottom-20 z-10 md:bottom-4">
        <button onClick={submit} disabled={busy} className="sticker-btn w-full bg-pink py-4 text-lg text-white disabled:opacity-60">
          {busy ? "Wird hochgeladen…" : "Einsenden 🚀"}
        </button>
      </div>

      {editImg && (
        <ImageEditor
          url={editImg.preview}
          overlays={editImg.overlays}
          onChange={(o) => setImages((p) => p.map((x) => (x.localId === editImg.localId ? { ...x, overlays: o } : x)))}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card-paper p-4">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-extrabold">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-sm text-paper">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
