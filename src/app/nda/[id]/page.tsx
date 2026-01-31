// src/app/nda/[id]/page.tsx
import { createClient } from "@supabase/supabase-js";

type PageProps = {
  params: { id: string };
};

export default async function NDAPage({ params }: PageProps) {
  const ndaId = params.id;

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Server configuration error</h2>
        <p>Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
      </div>
    );
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
  });

  // Support both `email` and `investor_email` (in case schema differs)
  const { data, error } = await sb
    .from("nda_requests")
    .select("id,status,unblur_until,email,investor_email,idea_id")
    .eq("id", ndaId)
    .maybeSingle();

  if (error) {
    console.error("NDA page fetch error:", error.message);
    return (
      <div style={{ padding: 24 }}>
        <h2>Error loading NDA</h2>
        <p>{error.message}</p>
        <p>NDA ID: {ndaId}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 24 }}>
        <h2>NDA not found</h2>
        <p>This NDA link is invalid or the record does not exist.</p>
        <p>NDA ID: {ndaId}</p>
      </div>
    );
  }

  const investorEmail = (data.email ?? data.investor_email ?? "") as string;

  return (
    <div style={{ padding: 24 }}>
      <h1>NDA Request</h1>

      <p><b>ID:</b> {data.id}</p>
      <p><b>Status:</b> {data.status}</p>
      <p><b>Email:</b> {investorEmail || "—"}</p>
      <p><b>Unblur Until:</b> {data.unblur_until ? String(data.unblur_until) : "—"}</p>

      <hr style={{ margin: "20px 0" }} />

      <p>
        This is where you show the NDA PDF download + upload signed NDA UI.
      </p>
    </div>
  );
}