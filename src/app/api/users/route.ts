import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { listClassmates } from "@/lib/repo";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ users: [] }, { status: 401 });
  const users = await listClassmates();
  return NextResponse.json({ users });
}
