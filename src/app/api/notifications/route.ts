import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { listNotifications, markNotificationsRead } from "@/lib/repo";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ notifications: [] });
  const notifications = await listNotifications(user.id);
  return NextResponse.json({ notifications: notifications.slice(0, 30) });
}

export async function PATCH() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  await markNotificationsRead(user.id);
  return NextResponse.json({ ok: true });
}
