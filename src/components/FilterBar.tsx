"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Search, X, SlidersHorizontal, Shuffle } from "lucide-react";
import { CATEGORIES, POST_TYPES, TIMELINE_YEARS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [more, setMore] = useState(false);
  const [q, setQ] = useState(sp.get("q") ?? "");

  function setParam(key: string, value?: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  const active = {
    category: sp.get("category"),
    type: sp.get("type"),
    tag: sp.get("tag"),
    person: sp.get("person"),
    event: sp.get("event"),
    year: sp.get("year"),
    sort: sp.get("sort") ?? "new",
  };

  const hasPills = active.tag || active.person || active.event;

  return (
    <div className="space-y-3">
      {/* search */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-paper-2 bg-white px-4 py-2">
          <Search size={18} className="text-ink-soft" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setParam("q", q || undefined)}
            placeholder="Suche nach Zitat, Person, Tag, Event…"
            className="w-full bg-transparent font-semibold outline-none"
          />
          {q && (
            <button onClick={() => { setQ(""); setParam("q", undefined); }}>
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setMore((v) => !v)}
          className={cn("sticker-btn bg-white px-3 py-2", more && "bg-ink text-paper")}
          title="Mehr Filter"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* active pills */}
      {hasPills && (
        <div className="flex flex-wrap gap-2">
          {active.tag && (
            <Pill onClear={() => setParam("tag")}>#{active.tag}</Pill>
          )}
          {active.event && (
            <Pill onClear={() => setParam("event")}>📍 {active.event}</Pill>
          )}
          {active.person && (
            <Pill onClear={() => setParam("person")}>🧑 Person</Pill>
          )}
        </div>
      )}

      {/* category chips */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          className="chip"
          data-active={!active.category}
          onClick={() => setParam("category")}
        >
          Alles
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className="chip"
            data-active={active.category === c.id}
            onClick={() => setParam("category", c.id)}
          >
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      {/* sort */}
      <div className="flex items-center gap-2">
        {(["new", "top", "random"] as const).map((s) => (
          <button
            key={s}
            className="chip"
            data-active={active.sort === s}
            onClick={() => setParam("sort", s === "new" ? undefined : s)}
          >
            {s === "new" ? "Neueste" : s === "top" ? "🔥 Beliebt" : <><Shuffle size={13} /> Zufall</>}
          </button>
        ))}
      </div>

      {/* more filters */}
      {more && (
        <div className="space-y-3 rounded-card border border-paper-2 bg-white p-3">
          <div>
            <p className="mb-1 text-xs font-bold uppercase text-ink-soft">Typ</p>
            <div className="flex flex-wrap gap-2">
              {POST_TYPES.map((t) => (
                <button
                  key={t.id}
                  className="chip"
                  data-active={active.type === t.id}
                  onClick={() => setParam("type", active.type === t.id ? undefined : t.id)}
                >
                  {t.emoji} {t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold uppercase text-ink-soft">Schuljahr</p>
            <div className="flex flex-wrap gap-2">
              {TIMELINE_YEARS.map((y) => (
                <button
                  key={y}
                  className="chip"
                  data-active={active.year === y}
                  onClick={() => setParam("year", active.year === y ? undefined : y)}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-sm font-semibold text-paper">
      {children}
      <button onClick={onClear} className="ml-0.5">
        <X size={14} />
      </button>
    </span>
  );
}
