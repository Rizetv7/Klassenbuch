import { NextRequest } from "next/server";
import { colorFor, initials } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const ini = initials(decoded) || "?";
  const bg = colorFor(decoded);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${bg}"/>
    <stop offset="100%" stop-color="${bg}cc"/>
  </linearGradient></defs>
  <rect width="200" height="200" fill="url(#g)"/>
  <text x="100" y="100" dy=".35em" text-anchor="middle"
    font-family="'Baloo 2', Nunito, system-ui, sans-serif" font-size="86"
    font-weight="700" fill="#fff">${ini}</text>
</svg>`;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
