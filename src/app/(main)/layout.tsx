import { redirect } from "next/navigation";
import { getCurrentUser, toPublicUser } from "@/lib/session";
import { Shell } from "@/components/Shell";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/join");
  return <Shell me={toPublicUser(user)}>{children}</Shell>;
}
