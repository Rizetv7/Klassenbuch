"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Heart,
  Sparkles,
  Bookmark,
  Flag,
  Trash2,
  Pin,
  Send,
} from "lucide-react";
import type { PostView, PublicUser } from "@/lib/types";
import type { CommentView } from "@/lib/repo";
import { REACTIONS, categoryMeta, postTypeMeta } from "@/lib/constants";
import { cn, relativeTime } from "@/lib/utils";
import { apiPost, apiPatch, apiDelete } from "@/lib/api";
import { Avatar } from "./Avatar";
import { OverlayLayer } from "./OverlayText";
import { SaveToCollection } from "./SaveToCollection";

export function PostDetail({
  post,
  comments: initialComments,
  me,
  isAdmin,
}: {
  post: PostView;
  comments: CommentView[];
  me: PublicUser;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.iLiked);
  const [likes, setLikes] = useState(post.likeCount);
  const [reacts, setReacts] = useState(post.reactions);
  const [nominated, setNominated] = useState(post.iNominated);
  const [noms, setNoms] = useState(post.nominationCount);
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const cat = categoryMeta(post.category);
  const type = postTypeMeta(post.type);

  async function toggleLike() {
    setLiked((v) => !v);
    setLikes((n) => n + (liked ? -1 : 1));
    await apiPost(`/api/posts/${post.id}/react`, { emoji: "like" }).catch(() => {});
  }
  async function react(emoji: string) {
    setReacts((prev) => {
      const f = prev.find((r) => r.emoji === emoji);
      if (f?.mine)
        return prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r)).filter((r) => r.count > 0);
      if (f) return prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r));
      return [...prev, { emoji, count: 1, mine: true }];
    });
    await apiPost(`/api/posts/${post.id}/react`, { emoji }).catch(() => {});
  }
  async function nominate() {
    setNominated((v) => !v);
    setNoms((n) => n + (nominated ? -1 : 1));
    await apiPost(`/api/posts/${post.id}/react`, { emoji: "nominate" }).catch(() => {});
  }
  async function report() {
    await apiPost(`/api/posts/${post.id}/report`).catch(() => {});
    alert("Danke, die Redaktion schaut sich das an.");
  }
  async function del() {
    if (!confirm("Beitrag wirklich löschen?")) return;
    await apiDelete(`/api/posts/${post.id}`).catch(() => {});
    router.push("/");
    router.refresh();
  }
  async function pin() {
    await apiPatch(`/api/posts/${post.id}`, { pinned: !post.pinned }).catch(() => {});
    router.refresh();
  }
  async function submitComment(e: React.FormEvent, parentId?: string) {
    e.preventDefault();
    if (!text.trim()) return;
    const { comment } = await apiPost<{ comment: CommentView }>(
      `/api/posts/${post.id}/comments`,
      { body: text.trim(), anon, parentId },
    );
    setComments((c) => [...c, { ...comment, author: anon ? me : me }]);
    setText("");
  }

  const roots = comments.filter((c) => !c.parentId);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* media gallery */}
      {post.media.length > 0 && (
        <div className={cn("grid gap-3", post.media.length > 1 ? "sm:grid-cols-2" : "")}>
          {post.media.map((m) => (
            <div
              key={m.id}
              className="polaroid"
              style={{ containerType: "inline-size" }}
            >
              <div className="relative overflow-hidden rounded-[0.3rem]">
                <img src={m.url} alt={post.title ?? "Bild"} className="block w-full" />
                <OverlayLayer overlays={m.overlays} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* main card */}
      <div className="card-paper p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold">
          <Link href={`/explore?category=${post.category}`} className="chip">
            {cat.emoji} {cat.name}
          </Link>
          <span className="chip">{type.emoji} {type.name}</span>
          {post.event && (
            <Link href={`/explore?event=${encodeURIComponent(post.event)}`} className="chip">
              📍 {post.event}
            </Link>
          )}
          {post.year && (
            <Link href={`/explore?year=${encodeURIComponent(post.year)}`} className="chip">
              🗓️ {post.year}
            </Link>
          )}
          {post.visibility === "anon" && <span className="chip">🕶️ anonym</span>}
          {post.visibility === "redaktion" && <span className="chip">🔒 nur Redaktion</span>}
        </div>

        {post.title && <h1 className="font-display text-2xl font-extrabold">{post.title}</h1>}
        {post.body && <p className="mt-2 whitespace-pre-wrap text-lg leading-relaxed">{post.body}</p>}

        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <Link key={t} href={`/explore?tag=${encodeURIComponent(t)}`} className="text-sm font-semibold text-blue hover:underline">
                #{t}
              </Link>
            ))}
          </div>
        )}

        {post.tagged.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-bold uppercase text-ink-soft">Dabei</p>
            <div className="flex flex-wrap gap-2">
              {post.tagged.map((u) => (
                <Link key={u.id} href={`/profile/${u.id}`} className="flex items-center gap-1.5 rounded-full border border-paper-2 bg-white py-1 pl-1 pr-3">
                  <Avatar user={u} size={22} />
                  <span className="text-sm font-semibold">{u.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* author */}
        <div className="mt-4 flex items-center gap-2 border-t border-dashed border-paper-2 pt-3">
          {post.author ? (
            <Link href={`/profile/${post.author.id}`} className="flex items-center gap-2">
              <Avatar user={post.author} size={32} />
              <span className="text-sm font-bold">{post.author.name}</span>
            </Link>
          ) : (
            <span className="flex items-center gap-2 text-sm font-bold text-ink-soft">
              <Avatar user={null} size={32} /> Anonym
            </span>
          )}
          <span className="text-sm text-ink-soft">· {relativeTime(post.createdAt)}</span>
        </div>

        {/* actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={toggleLike} className={cn("sticker-btn flex items-center gap-1.5 bg-white px-4 py-2 text-sm", liked && "bg-pink text-white")}>
            <Heart size={16} className={cn(liked && "fill-white")} /> {likes}
          </button>
          <button onClick={nominate} className={cn("sticker-btn flex items-center gap-1.5 bg-white px-4 py-2 text-sm", nominated && "bg-yellow")}>
            <Sparkles size={16} /> Ins Heft · {noms}
          </button>
          <button onClick={() => setShowSave(true)} className="sticker-btn flex items-center gap-1.5 bg-white px-4 py-2 text-sm">
            <Bookmark size={16} /> Speichern
          </button>
          <div className="flex items-center gap-1 rounded-full border border-paper-2 bg-white px-2 py-1">
            {REACTIONS.map((e) => {
              const mine = reacts.find((r) => r.emoji === e)?.mine;
              return (
                <button key={e} onClick={() => react(e)} className={cn("rounded-full px-1 text-lg transition hover:scale-125", mine && "scale-110")}>
                  {e}
                </button>
              );
            })}
          </div>
          <button onClick={report} className="ml-auto flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-ink-soft hover:bg-paper-2">
            <Flag size={14} /> Melden
          </button>
          {isAdmin && (
            <>
              <button onClick={pin} className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold hover:bg-paper-2">
                <Pin size={14} /> {post.pinned ? "Lösen" : "Pin"}
              </button>
              <button onClick={del} className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">
                <Trash2 size={14} /> Löschen
              </button>
            </>
          )}
        </div>
        {reacts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {reacts.map((r) => (
              <span key={r.emoji} className="rounded-full bg-paper-2 px-2 py-0.5 text-xs font-semibold">
                {r.emoji} {r.count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* comments */}
      <div className="card-paper p-5">
        <h2 className="mb-3 font-display text-lg font-extrabold">
          Kommentare · {comments.length}
        </h2>

        <form onSubmit={(e) => submitComment(e)} className="mb-4">
          <div className="flex items-start gap-2">
            <Avatar user={anon ? null : me} size={32} />
            <div className="flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                placeholder="Schreib was Nettes (oder Lustiges)…"
                className="kb-input"
              />
              <div className="mt-2 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
                  <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
                  Anonym
                </label>
                <button className="sticker-btn flex items-center gap-1.5 bg-ink px-4 py-2 text-sm text-paper">
                  <Send size={15} /> Senden
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="space-y-4">
          {roots.map((c) => (
            <CommentRow key={c.id} c={c} replies={repliesOf(c.id)} />
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-ink-soft">Noch keine Kommentare. Mach den Anfang!</p>
          )}
        </div>
      </div>

      {showSave && <SaveToCollection postId={post.id} onClose={() => setShowSave(false)} />}
    </div>
  );
}

function CommentRow({ c, replies }: { c: CommentView; replies: CommentView[] }) {
  return (
    <div className="flex items-start gap-2">
      <Avatar user={c.author} size={32} />
      <div className="flex-1">
        <div className="rounded-2xl rounded-tl-sm bg-paper-2 px-3 py-2">
          <p className="text-sm font-bold">
            {c.author ? (
              <Link href={`/profile/${c.author.id}`}>{c.author.name}</Link>
            ) : (
              "Anonym"
            )}
            <span className="ml-2 text-xs font-normal text-ink-soft">{relativeTime(c.createdAt)}</span>
          </p>
          <p className="whitespace-pre-wrap text-sm">{c.body}</p>
        </div>
        {replies.length > 0 && (
          <div className="ml-4 mt-2 space-y-2 border-l-2 border-paper-2 pl-3">
            {replies.map((r) => (
              <div key={r.id} className="flex items-start gap-2">
                <Avatar user={r.author} size={26} />
                <div className="rounded-2xl rounded-tl-sm bg-paper-2 px-3 py-1.5">
                  <p className="text-xs font-bold">{r.author?.name ?? "Anonym"}</p>
                  <p className="text-sm">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
