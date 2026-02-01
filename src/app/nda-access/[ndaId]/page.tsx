// src/app/nda-access/[ndaId]/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default async function NdaAccessPage({
  params,
}: {
  params: { ndaId?: string };
}) {
  const ndaId = (params?.ndaId || "").trim();

  if (!ndaId) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Invalid NDA ID.</h1>
      </main>
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceKey) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Server configuration error.</h1>
        <p>Missing Supabase environment variables.</p>
      </main>
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: nda, error } = await supabaseAdmin
    .from("nda_requests")
    .select("id, status, unblur_until, idea_id")
    .eq("id", ndaId)
    .maybeSingle();

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Server error.</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  if (!nda) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Invalid NDA ID.</h1>
      </main>
    );
  }

  if (nda.status !== "approved") {
    return (
      <main style={{ padding: 24 }}>
        <h1>NDA not approved.</h1>
      </main>
    );
  }

  if (!nda.unblur_until) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Access window missing.</h1>
      </main>
    );
  }

  const expires = new Date(nda.unblur_until).getTime();
  if (Number.isNaN(expires) || Date.now() > expires) {
    return (
      <main style={{ padding: 24 }}>
        <h1>NDA access expired.</h1>
      </main>
    );
  }

  // ✅ success → redirect to the real idea page
  redirect(`/investor/ideas/${nda.idea_id}`);
}