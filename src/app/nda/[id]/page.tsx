// src/app/nda-access/[ndaId]/page.tsx
import { createClient } from "@supabase/supabase-js";

export default async function NdaAccessPage({
  params,
}: {
  params: { ndaId: string };
}) {
  const ndaId = params?.ndaId;

  if (!ndaId) {
    return (
      <div style={{ padding: 30 }}>
        <h2>NDA ID is missing from the URL.</h2>
      </div>
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("nda_requests")
    .select("*")
    .eq("id", ndaId)
    .maybeSingle();

  if (error || !data) {
    return (
      <div style={{ padding: 30 }}>
        <h2>Invalid NDA ID.</h2>
        <p>This NDA request was not found.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>NDA Access Page</h1>

      <p>
        <b>Status:</b> {data.status}
      </p>

      <p>
        <b>Investor Email:</b> {data.email || data.investor_email}
      </p>

      <p>
        ✅ Your NDA request exists. Now you can build the UI to download + upload
        signed NDA.
      </p>
    </div>
  );
}