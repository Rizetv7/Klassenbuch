import { cn, colorFor, initials } from "@/lib/utils";
import type { PublicUser } from "@/lib/types";

export function Avatar({
  user,
  size = 36,
  className,
  ring,
}: {
  user?: Pick<PublicUser, "name" | "avatarUrl"> | null;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const name = user?.name ?? "Anonym";
  const style = { width: size, height: size };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-bold text-white select-none",
        ring && "ring-2 ring-white shadow",
        className,
      )}
      style={{ ...style, backgroundColor: colorFor(name) }}
      title={name}
    >
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt={name} width={size} height={size} className="h-full w-full object-cover" />
      ) : user ? (
        <span style={{ fontSize: size * 0.42 }}>{initials(name)}</span>
      ) : (
        <span style={{ fontSize: size * 0.5 }}>🕶️</span>
      )}
    </span>
  );
}
