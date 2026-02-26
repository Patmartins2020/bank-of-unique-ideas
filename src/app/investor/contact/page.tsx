import { Suspense } from "react";
import dynamicImport from "next/dynamic";

// ✅ Prevent static prerender/export for this page
export const dynamic = "force-dynamic";

// ✅ Load the client component only in the browser
const ContactClient = dynamicImport(() => import("./ContactClient"), {
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
      <ContactClient />
    </Suspense>
  );
}