"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { relativeTime } from "@/lib/utils";

interface Notif {
  id: string;
  text: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);

  async function load() {
    try {
      const r = await fetch("/api/notifications");
      const d = await r.json();
      setItems(d.notifications ?? []);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
      setItems((arr) => arr.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div className="relative">
      <button onClick={toggle} className="relative rounded-full p-2 hover:bg-paper-2" aria-label="Mitteilungen">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-pink px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-72 card-paper p-2">
          <p className="px-2 py-1 font-display font-bold">Mitteilungen</p>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-2 py-3 text-sm text-ink-soft">Noch nichts Neues 🌱</p>
            )}
            {items.map((n) => (
              <Link
                key={n.id}
                href={n.href ?? "#"}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-2 py-2 text-sm hover:bg-paper-2"
              >
                <span>{n.text}</span>
                <span className="block text-xs text-ink-soft">{relativeTime(n.createdAt)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
