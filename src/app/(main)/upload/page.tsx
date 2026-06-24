import { Suspense } from "react";
import { listClassmates } from "@/lib/repo";
import { UploadFlow } from "@/components/UploadFlow";

export const dynamic = "force-dynamic";

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ person?: string }>;
}) {
  const { person } = await searchParams;
  const classmates = await listClassmates();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-extrabold">Beitragen ✏️</h1>
      <p className="-mt-2 text-ink-soft">
        Lade Bilder, Zitate, Insider oder Ideen hoch — einzeln oder gleich mehrere.
      </p>
      <Suspense>
        <UploadFlow classmates={classmates} preselectPerson={person} />
      </Suspense>
    </div>
  );
}
