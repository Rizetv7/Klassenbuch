"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  House,
  Compass,
  Plus,
  Layers,
  Menu,
  X,
  LogOut,
  Shield,
  Clock,
  Archive,
} from "lucide-react";
import type { PublicUser } from "@/lib/types";
import { ROOMS, ACCENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { NotificationsBell } from "./NotificationsBell";

export function Shell({
  me,
  children,
}: {
  me: PublicUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const isAdmin = me.role === "admin";

  const nav = [
    { href: "/", label: "Home", icon: House },
    { href: "/explore", label: "Entdecken", icon: Compass },
    { href: "/collections", label: "Sammlungen", icon: Layers },
  ];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/join");
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-paper-2 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => setDrawer(true)}
            className="rounded-full p-2 hover:bg-paper-2 md:hidden"
            aria-label="Räume"
          >
            <Menu size={20} />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-lg shadow rotate-[-6deg]">
              📖
            </span>
            <span className="font-display text-xl font-extrabold leading-none">
              Klassen<span className="text-pink">buch</span>
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {nav.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-paper-2",
                    active && "bg-ink text-paper hover:bg-ink",
                  )}
                >
                  <n.icon size={16} /> {n.label}
                </Link>
              );
            })}
            <button
              onClick={() => setDrawer(true)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-paper-2"
            >
              <Archive size={16} /> Räume
            </button>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/upload"
              className="sticker-btn hidden items-center gap-1.5 bg-pink px-4 py-2 text-sm text-white sm:flex"
            >
              <Plus size={16} /> Beitragen
            </Link>
            <NotificationsBell />
            <div className="relative">
              <button onClick={() => setMenu((v) => !v)}>
                <Avatar user={me} size={36} ring />
              </button>
              {menu && (
                <div className="absolute right-0 top-11 z-40 w-48 card-paper p-1 text-sm">
                  <Link href={`/profile/${me.id}`} className="block rounded-lg px-3 py-2 font-semibold hover:bg-paper-2" onClick={() => setMenu(false)}>
                    Mein Profil
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 font-semibold hover:bg-paper-2" onClick={() => setMenu(false)}>
                      <Shield size={15} /> Admin
                    </Link>
                  )}
                  <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-semibold text-red-500 hover:bg-red-50">
                    <LogOut size={15} /> Abmelden
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 md:pb-10">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-paper-2 bg-paper/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
          <BottomLink href="/" icon={House} label="Home" active={pathname === "/"} />
          <BottomLink href="/explore" icon={Compass} label="Entdecken" active={pathname.startsWith("/explore")} />
          <Link href="/upload" className="sticker-btn -mt-6 grid h-14 w-14 place-items-center bg-pink text-white">
            <Plus size={26} />
          </Link>
          <BottomLink href="/collections" icon={Layers} label="Sammeln" active={pathname.startsWith("/collections")} />
          <BottomLink href={`/profile/${me.id}`} icon={UserAvatarIcon(me)} label="Profil" active={pathname.startsWith("/profile")} />
        </div>
      </nav>

      {/* Rooms drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setDrawer(false)}>
          <aside
            className="absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-paper p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold">Matura Campus</h2>
              <button onClick={() => setDrawer(false)} className="rounded-full p-2 hover:bg-paper-2">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {ROOMS.map((r) => (
                <Link
                  key={r.id}
                  href={`/rooms/${r.id}`}
                  onClick={() => setDrawer(false)}
                  className="flex items-center gap-3 rounded-2xl border border-paper-2 bg-white p-3 transition hover:-translate-y-0.5"
                  style={{ borderLeft: `6px solid ${ACCENTS[r.accent]}` }}
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <span>
                    <span className="block font-display font-bold">{r.name}</span>
                    <span className="block text-xs text-ink-soft">{r.tagline}</span>
                  </span>
                </Link>
              ))}
              <Link href="/timeline" onClick={() => setDrawer(false)} className="flex items-center gap-3 rounded-2xl border border-paper-2 bg-white p-3 hover:-translate-y-0.5">
                <Clock size={22} /> <span className="font-display font-bold">Zeitstrahl</span>
              </Link>
              <Link href="/explore" onClick={() => setDrawer(false)} className="flex items-center gap-3 rounded-2xl border border-paper-2 bg-white p-3 hover:-translate-y-0.5">
                <Archive size={22} /> <span className="font-display font-bold">Archiv (alles)</span>
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setDrawer(false)} className="flex items-center gap-3 rounded-2xl border border-paper-2 bg-white p-3 hover:-translate-y-0.5">
                  <Shield size={22} /> <span className="font-display font-bold">Admin</span>
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function BottomLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold",
        active ? "text-pink" : "text-ink-soft",
      )}
    >
      <Icon size={22} />
      {label}
    </Link>
  );
}

// Render the user's avatar as the profile tab icon.
function UserAvatarIcon(me: PublicUser) {
  const Icon = ({ size = 22 }: { size?: number }) => <Avatar user={me} size={size} />;
  Icon.displayName = "UserAvatarIcon";
  return Icon;
}
