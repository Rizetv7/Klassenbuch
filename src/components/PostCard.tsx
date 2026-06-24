"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Sparkles,
  Trash2,
  Pin,
  Smile,
  Bookmark,
} from "lucide-react";
import type { PostView } from "@/lib/types";
import { REACTIONS, categoryMeta } from "@/lib/constants";
import { cn, relativeTime, tilt } from "@/lib/utils";
import { apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Avatar } from "./Avatar";
import { OverlayLayer } from "./OverlayText";
import { SaveToCollection } from "./SaveToCollection";

const QUOTE_BG: Record<string, string> = {
  zitate: "bg-blue text-white",
  lehrer: "bg-yellow text-ink",
  ideen: "bg-green text-white",
  "honorable-mentions": "bg-purple text-white",
  personen: "bg-pink text-white",
  default: "bg-ink text-paper",
};

export function PostCard({
  post,
  isAdmin = false,
  flat = false,
}: {
  post: PostView;
  isAdmin?: boolean;
  flat?: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.iLiked);
  const [likes, setLikes] = useState(post.likeCount);
  const [reacts, setReacts] = useState(post.reactions);
  const [nominated, setNominated] = useState(post.iNominated);
  const [noms, setNoms] = useState(post.nominationCount);
  const [showReacts, setShowReacts] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const cat = categoryMeta(post.category);
  const cover = post.media[0];

  async function toggleLike() {
    setLiked((v) => !v);
    setLikes((n) => n + (liked ? -1 : 1));
    await apiPost(`/api/posts/${post.id}/react`, { emoji: "like" }).catch(() => {});
  }

  async function react(emoji: string) {
    setShowReacts(false);
    setReacts((prev) => {
      const found = prev.find((r) => r.emoji === emoji);
      if (found?.mine)
        return prev
          .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r))
          .filter((r) => r.count > 0);
      if (found)
        return prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r));
      return [...prev, { emoji, count: 1, mine: true }];
    });
    await apiPost(`/api/posts/${post.id}/react`, { emoji }).catch(() => {});
  }

  async function nominate() {
    setNominated((v) => !v);
    setNoms((n) => n + (nominated ? -1 : 1));
    await apiPost(`/api/posts/${post.id}/react`, { emoji: "nominate" }).catch(() => {});
  }

  async function del() {
    if (!confirm("Beitrag wirklich löschen?")) return;
    await apiDelete(`/api/posts/${post.id}`).catch(() => {});
    router.refresh();
  }
  async function pin() {
    await apiPatch(`/api/posts/${post.id}`, { pinned: !post.pinned }).catch(() => {});
    router.refresh();
  }

  return (
    <div
      className={cn("group relative", !flat && "transition-transform hover:-translate-y-1")}
      style={{ rotate: flat ? undefined : `${tilt(post.id, 2.2)}deg` }}
    >
      {post.pinned && (
        <span className="absolute -left-2 -top-2 z-10 rounded-full bg-pink px-2 py-0.5 text-xs font-bold text-white shadow rotate-[-8deg]">
          📌 angepinnt
        </span>
      )}

      <div className={cn(cover ? "polaroid" : "card-paper p-3")}>
        <Link href={`/post/${post.id}`} className="block">
          {cover ? (
            <div
              className="relative w-full overflow-hidden rounded-[0.3rem] bg-paper-2"
              style={{ containerType: "inline-size" }}
            >
              <img
                src={cover.url}
                alt={post.title ?? "Bild"}
                className="block w-full object-cover"
              />
              <OverlayLayer overlays={cover.overlays} />
              {post.media.length > 1 && (
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
                  +{post.media.length - 1}
                </span>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "flex min-h-32 flex-col justify-center rounded-xl p-4",
                QUOTE_BG[post.category] ?? QUOTE_BG.default,
              )}
            >
              <span className="mb-1 text-2xl">{cat.emoji}</span>
              {post.body && (
                <p className="font-display text-lg leading-snug font-bold">{post.body}</p>
              )}
              {post.title && (
                <p className="mt-2 text-sm opacity-80 font-hand text-xl">— {post.title}</p>
              )}
            </div>
          )}
        </Link>

        {/* caption / meta */}
        <div className="px-1 pt-2">
          {cover && (post.title || post.body) && (
            <Link href={`/post/${post.id}`}>
              {post.title && <p className="font-display font-bold leading-tight">{post.title}</p>}
              {post.body && <p className="text-sm text-ink-soft line-clamp-2">{post.body}</p>}
            </Link>
          )}

          {post.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((t) => (
                <Link key={t} href={`/explore?tag=${encodeURIComponent(t)}`} className="text-xs font-semibold text-blue hover:underline">
                  #{t}
                </Link>
              ))}
            </div>
          )}

          {/* author */}
          <div className="mt-2 flex items-center gap-2">
            {post.author ? (
              <Link href={`/profile/${post.author.id}`} className="flex items-center gap-1.5">
                <Avatar user={post.author} size={22} />
                <span className="text-xs font-semibold">{post.author.name}</span>
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                <Avatar user={null} size={22} /> Anonym
              </span>
            )}
            <span className="text-xs text-ink-soft">· {relativeTime(post.createdAt)}</span>
          </div>

          {/* interaction bar */}
          <div className="relative mt-2 flex items-center gap-1 text-ink-soft">
            <button
              onClick={toggleLike}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold hover:bg-paper-2",
                liked && "text-pink",
              )}
            >
              <Heart size={16} className={cn(liked && "fill-pink", "transition", liked && "animate-pop")} /> {likes}
            </button>

            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold hover:bg-paper-2"
            >
              <MessageCircle size={16} /> {post.commentCount}
            </Link>

            <button
              onClick={() => setShowReacts((v) => !v)}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-sm hover:bg-paper-2"
            >
              <Smile size={16} />
              {reacts.length > 0 && (
                <span className="font-semibold">{reacts.reduce((a, r) => a + r.count, 0)}</span>
              )}
            </button>

            <button
              onClick={nominate}
              title="Soll das ins Heft?"
              className={cn(
                "ml-auto flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold hover:bg-paper-2",
                nominated && "text-yellow",
              )}
            >
              <Sparkles size={16} className={cn(nominated && "fill-yellow")} /> {noms}
            </button>

            <button
              onClick={() => setShowSave((v) => !v)}
              title="In Sammlung speichern"
              className="flex items-center rounded-full px-2 py-1 hover:bg-paper-2"
            >
              <Bookmark size={16} />
            </button>

            {showReacts && (
              <div className="absolute -top-10 left-0 z-20 flex gap-1 rounded-full bg-white px-2 py-1 shadow-lg">
                {REACTIONS.map((e) => (
                  <button key={e} onClick={() => react(e)} className="text-lg hover:scale-125 transition">
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {reacts.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {reacts.map((r) => (
                <button
                  key={r.emoji}
                  onClick={() => react(r.emoji)}
                  className={cn(
                    "rounded-full border px-1.5 py-0.5 text-xs",
                    r.mine ? "border-ink bg-paper-2" : "border-transparent bg-paper-2/60",
                  )}
                >
                  {r.emoji} {r.count}
                </button>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className="mt-2 flex gap-1 border-t border-dashed border-paper-2 pt-2">
              <button onClick={pin} className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-ink-soft hover:bg-paper-2">
                <Pin size={13} /> {post.pinned ? "Lösen" : "Anpinnen"}
              </button>
              <button onClick={del} className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">
                <Trash2 size={13} /> Löschen
              </button>
            </div>
          )}
        </div>
      </div>

      {showSave && (
        <SaveToCollection postId={post.id} onClose={() => setShowSave(false)} />
      )}
    </div>
  );
}
