import type { Overlay, TextStyle } from "@/lib/types";
import { cn } from "@/lib/utils";

export function textStyleClasses(style: TextStyle, color?: string): {
  className: string;
  style: React.CSSProperties;
} {
  switch (style) {
    case "tiktok":
      return {
        className: "font-display font-extrabold text-white",
        style: {
          WebkitTextStroke: "2px #000",
          paintOrder: "stroke fill",
          textShadow: "0 1px 0 #000",
        } as React.CSSProperties,
      };
    case "bubble-white":
      return { className: "font-display font-bold text-black bg-white px-2 py-0.5 rounded-md", style: {} };
    case "bubble-black":
      return { className: "font-display font-bold text-white bg-black px-2 py-0.5 rounded-md", style: {} };
    case "bubble-color":
      return {
        className: "font-display font-bold text-white px-2 py-0.5 rounded-md",
        style: { background: color ?? "#ff6fb5" },
      };
    case "imessage":
      return { className: "font-body font-semibold text-white bg-[#0a84ff] px-2.5 py-1 rounded-2xl", style: {} };
    case "meme":
      return {
        className: "font-display font-extrabold uppercase text-white tracking-wide",
        style: { WebkitTextStroke: "2px #000", paintOrder: "stroke fill" } as React.CSSProperties,
      };
    case "handwritten":
      return { className: "font-hand text-2xl font-bold text-ink", style: {} };
    case "newspaper":
      return { className: "font-serif font-bold text-black bg-paper-2 px-2 py-0.5", style: {} };
    default:
      return { className: "font-display text-white", style: {} };
  }
}

/** Renders text + sticker overlays absolutely positioned over a media box. */
export function OverlayLayer({
  overlays,
  className,
}: {
  overlays?: Overlay[];
  className?: string;
}) {
  if (!overlays?.length) return null;
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      {overlays.map((o) => {
        const pos: React.CSSProperties = {
          position: "absolute",
          left: `${o.x * 100}%`,
          top: `${o.y * 100}%`,
          transform: `translate(-50%, -50%) rotate(${o.rotation}deg) scale(${o.scale})`,
          maxWidth: "90%",
        };
        if (o.kind === "sticker") {
          const isEmoji = /\p{Emoji}/u.test(o.sticker) && o.sticker.length <= 3;
          return (
            <span
              key={o.id}
              style={{ ...pos, fontSize: isEmoji ? "2.5rem" : undefined }}
              className={
                isEmoji
                  ? "drop-shadow"
                  : "rounded-full bg-yellow px-3 py-1 font-display text-sm font-extrabold text-ink shadow -rotate-3"
              }
            >
              {o.sticker}
            </span>
          );
        }
        const t = textStyleClasses(o.style, o.color);
        return (
          <span
            key={o.id}
            style={{ ...pos, ...t.style, fontSize: "clamp(1rem, 5cqw, 2rem)" }}
            className={cn("text-center leading-tight", t.className)}
          >
            {o.text}
          </span>
        );
      })}
    </div>
  );
}
