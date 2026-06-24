"use client";

import { useRef, useState } from "react";
import { Type, Sticker, Trash2, RotateCw, Plus, Minus } from "lucide-react";
import type { Overlay, TextStyle } from "@/lib/types";
import { TEXT_STYLES, STICKER_PRESETS, ACCENTS } from "@/lib/constants";
import { textStyleClasses } from "./OverlayText";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";

/**
 * TikTok-style overlay editor. Add draggable text bubbles (white+black outline,
 * solid colour, bubbles…) and stickers on top of an image. Overlays are stored
 * as data (relative coords) so they stay editable — the original is untouched.
 */
export function ImageEditor({
  url,
  overlays,
  onChange,
  onClose,
}: {
  url: string;
  overlays: Overlay[];
  onChange: (o: Overlay[]) => void;
  onClose: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Overlay[]>(overlays);
  const [sel, setSel] = useState<string | null>(null);
  const [tab, setTab] = useState<"text" | "sticker">("text");
  const dragging = useRef<string | null>(null);

  function update(next: Overlay[]) {
    setItems(next);
    onChange(next);
  }
  function patch(id: string, p: Partial<Overlay>) {
    update(items.map((o) => (o.id === id ? ({ ...o, ...p } as Overlay) : o)));
  }

  function addText() {
    const o: Overlay = {
      kind: "text",
      id: nanoid(6),
      text: "Tippen zum Ändern",
      style: "tiktok",
      x: 0.5,
      y: 0.5,
      rotation: 0,
      scale: 1,
      color: ACCENTS.pink,
    };
    update([...items, o]);
    setSel(o.id);
  }
  function addSticker(s: string) {
    const o: Overlay = {
      kind: "sticker",
      id: nanoid(6),
      sticker: s,
      x: 0.5,
      y: 0.5,
      rotation: 0,
      scale: 1,
    };
    update([...items, o]);
    setSel(o.id);
  }
  function remove(id: string) {
    update(items.filter((o) => o.id !== id));
    setSel(null);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    patch(dragging.current, { x, y });
  }

  const selected = items.find((o) => o.id === sel);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
      <div className="flex items-center justify-between p-3 text-white">
        <span className="font-display text-lg font-bold">Bild bearbeiten</span>
        <button onClick={onClose} className="sticker-btn bg-white px-4 py-1.5 text-sm text-ink">
          Fertig
        </button>
      </div>

      {/* canvas */}
      <div className="flex flex-1 items-center justify-center overflow-hidden p-3">
        <div
          ref={boxRef}
          className="relative max-h-full max-w-full touch-none select-none"
          style={{ containerType: "inline-size" }}
          onPointerMove={onPointerMove}
          onPointerUp={() => (dragging.current = null)}
          onPointerLeave={() => (dragging.current = null)}
        >
          <img src={url} alt="" className="max-h-[60vh] w-auto rounded-lg" draggable={false} />
          {items.map((o) => {
            const common: React.CSSProperties = {
              position: "absolute",
              left: `${o.x * 100}%`,
              top: `${o.y * 100}%`,
              transform: `translate(-50%,-50%) rotate(${o.rotation}deg) scale(${o.scale})`,
              cursor: "grab",
              touchAction: "none",
            };
            const isSel = o.id === sel;
            const ring = isSel ? "outline outline-2 outline-dashed outline-white/80 outline-offset-2" : "";
            if (o.kind === "sticker") {
              const emoji = /\p{Emoji}/u.test(o.sticker) && o.sticker.length <= 3;
              return (
                <span
                  key={o.id}
                  style={{ ...common, fontSize: emoji ? "2.5rem" : undefined }}
                  className={cn(ring, !emoji && "rounded-full bg-yellow px-3 py-1 font-display text-sm font-extrabold text-ink shadow")}
                  onPointerDown={(e) => { e.preventDefault(); setSel(o.id); dragging.current = o.id; }}
                >
                  {o.sticker}
                </span>
              );
            }
            const t = textStyleClasses(o.style, o.color);
            return (
              <span
                key={o.id}
                style={{ ...common, ...t.style, fontSize: "clamp(1rem,6cqw,2.2rem)" }}
                className={cn("text-center leading-tight", t.className, ring)}
                onPointerDown={(e) => { e.preventDefault(); setSel(o.id); dragging.current = o.id; }}
              >
                {o.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* selected controls */}
      {selected && (
        <div className="mx-3 mb-2 space-y-2 rounded-2xl bg-white p-3">
          {selected.kind === "text" && (
            <>
              <input
                value={selected.text}
                onChange={(e) => patch(selected.id, { text: e.target.value })}
                className="kb-input"
                placeholder="Text…"
              />
              <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
                {TEXT_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => patch(selected.id, { style: s.id as TextStyle })}
                    className="chip"
                    data-active={selected.style === s.id}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-ink-soft">Farbe</span>
                {([...Object.values(ACCENTS), "#ffffff", "#000000"] as string[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => patch(selected.id, { color: c })}
                    className="h-6 w-6 rounded-full border-2 border-paper-2"
                    style={{ background: c }}
                  />
                ))}
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => patch(selected.id, { scale: Math.max(0.4, selected.scale - 0.15) })} className="sticker-btn bg-paper-2 p-2"><Minus size={16} /></button>
            <button onClick={() => patch(selected.id, { scale: Math.min(3, selected.scale + 0.15) })} className="sticker-btn bg-paper-2 p-2"><Plus size={16} /></button>
            <button onClick={() => patch(selected.id, { rotation: (selected.rotation + 15) % 360 })} className="sticker-btn bg-paper-2 p-2"><RotateCw size={16} /></button>
            <button onClick={() => remove(selected.id)} className="sticker-btn ml-auto bg-red-100 p-2 text-red-600"><Trash2 size={16} /></button>
          </div>
        </div>
      )}

      {/* add toolbar */}
      <div className="bg-white p-3">
        <div className="mb-2 flex gap-2">
          <button onClick={() => setTab("text")} className="chip" data-active={tab === "text"}><Type size={14} /> Text</button>
          <button onClick={() => setTab("sticker")} className="chip" data-active={tab === "sticker"}><Sticker size={14} /> Sticker</button>
        </div>
        {tab === "text" ? (
          <button onClick={addText} className="sticker-btn flex w-full items-center justify-center gap-1.5 bg-ink py-2.5 text-paper">
            <Plus size={16} /> Text hinzufügen
          </button>
        ) : (
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {STICKER_PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => addSticker(s)}
                className={cn(
                  "shrink-0 rounded-xl border border-paper-2 px-3 py-2",
                  /\p{Emoji}/u.test(s) && s.length <= 3 ? "text-2xl" : "bg-yellow font-display text-xs font-extrabold",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
