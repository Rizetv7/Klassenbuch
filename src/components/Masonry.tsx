import { cn } from "@/lib/utils";

/** Simple CSS-columns masonry — perfect for a scrapbook wall. */
export function Masonry({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "columns-2 gap-3 sm:columns-2 md:columns-3 lg:columns-4 [&>*]:mb-3 [&>*]:break-inside-avoid",
        className,
      )}
    >
      {children}
    </div>
  );
}
