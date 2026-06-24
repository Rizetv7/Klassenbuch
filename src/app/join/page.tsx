import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { JoinForm } from "./JoinForm";

export default async function JoinPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="pointer-events-none absolute left-6 top-10 text-5xl opacity-70 rotate-[-12deg]">📸</div>
      <div className="pointer-events-none absolute right-8 top-24 text-4xl opacity-70 rotate-[10deg]">💬</div>
      <div className="pointer-events-none absolute bottom-16 left-10 text-4xl opacity-70 rotate-[8deg]">✨</div>

      <div className="mb-6 text-center">
        <span className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-ink text-3xl shadow rotate-[-6deg]">
          📖
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-none">
          Klassen<span className="text-pink">buch</span>
        </h1>
        <p className="mt-2 font-hand text-2xl text-ink-soft">
          unsere Maturazeitung – an einem Ort
        </p>
      </div>

      <JoinForm />

      <p className="mt-6 text-center text-xs text-ink-soft">
        Demo-Code: <span className="font-bold">MATURA26</span> · Admin: Name
        „Frau Redaktion“ + Passwort „matura-admin“ im Tab „Schon dabei?“
      </p>
    </div>
  );
}
