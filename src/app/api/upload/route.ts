import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { getCurrentUser } from "@/lib/session";
import { IS_SERVERLESS } from "@/lib/db";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

/**
 * Locally: saves uploaded images to /public/uploads and returns their paths.
 * On serverless (Vercel, read-only FS): returns inline data URLs so uploads
 * still work without object storage — the image rides inside the record.
 * For real production swap this for object storage (Supabase Storage / R2).
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0)
    return NextResponse.json({ error: "Keine Dateien" }, { status: 400 });

  const urls: string[] = [];

  for (const file of files) {
    if (!ALLOWED.includes(file.type)) continue;
    if (file.size > 12 * 1024 * 1024) continue; // 12MB cap
    const buf = Buffer.from(await file.arrayBuffer());

    if (IS_SERVERLESS) {
      urls.push(`data:${file.type};base64,${buf.toString("base64")}`);
      continue;
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const ext = EXT[file.type] ?? "bin";
    const name = `${Date.now()}-${nanoid(8)}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
    urls.push(`/uploads/${name}`);
  }

  return NextResponse.json({ urls });
}
