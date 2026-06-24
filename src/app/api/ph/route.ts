import { NextRequest } from "next/server";
import { ACCENTS } from "@/lib/constants";

const GRADIENTS: Record<string, [string, string]> = {
  blue: ["#4d7cfe", "#7aa2ff"],
  pink: ["#ff6fb5", "#ff9ed0"],
  yellow: ["#ffc93c", "#ffe08a"],
  green: ["#36c58f", "#74e0b6"],
  purple: ["#9b7bff", "#c3b0ff"],
};

function esc(s: string) {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const label = esc(searchParams.get("l") ?? "");
  const colorKey = searchParams.get("c") ?? "blue";
  const [a, b] = GRADIENTS[colorKey] ?? GRADIENTS.blue;
  void ACCENTS;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="100%" stop-color="${b}"/>
    </linearGradient>
    <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="6" cy="6" r="3" fill="#ffffff22"/>
    </pattern>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <rect width="800" height="800" fill="url(#dots)"/>
  <text x="400" y="400" dy=".35em" text-anchor="middle"
    font-family="'Baloo 2', Nunito, system-ui, sans-serif" font-size="64"
    font-weight="700" fill="#ffffff">${label}</text>
</svg>`;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
