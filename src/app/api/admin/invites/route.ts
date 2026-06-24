import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getDB, mutate, now } from "@/lib/db";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const db = await getDB();
  return NextResponse.json({ invites: db.invites });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { code, label } = await req.json().catch(() => ({}));
  const cleanCode = String(code || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!cleanCode) return NextResponse.json({ error: "Code fehlt" }, { status: 400 });
  await mutate((db) => {
    if (db.invites.some((i) => i.code.toLowerCase() === cleanCode.toLowerCase())) return;
    db.invites.push({
      code: cleanCode,
      label: String(label || "Neuer Code"),
      active: true,
      createdBy: admin.id,
      createdAt: now(),
    });
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { code, active } = await req.json().catch(() => ({}));
  await mutate((db) => {
    const inv = db.invites.find((i) => i.code === code);
    if (inv) inv.active = !!active;
  });
  return NextResponse.json({ ok: true });
}
