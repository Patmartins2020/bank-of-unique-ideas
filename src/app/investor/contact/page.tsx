import { Suspense } from "react";
import ContactClient from "./ContactClient";

export const dynamic = "force-dynamic"; // ✅ stops prerender/export build error

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
      <ContactClient />
    </Suspense>
  );
}