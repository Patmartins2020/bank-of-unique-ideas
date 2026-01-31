// src/pages/nda-access/[ndaId].tsx
import type { GetServerSideProps } from "next";
import { createClient } from "@supabase/supabase-js";

export default function NdaAccess({ ok, message, nda }: any) {
  if (!ok) {
    return (
      <div style={{ padding: 30 }}>
        <h2>{message}</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>NDA Access</h1>
      <p><b>ID:</b> {nda.id}</p>
      <p><b>Status:</b> {nda.status}</p>
      <p><b>Email:</b> {nda.email || nda.investor_email}</p>
      <p>✅ Route is working. Next step is to add download + upload UI here.</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const ndaId = String(ctx.params?.ndaId || "").trim();
  if (!ndaId) {
    return { props: { ok: false, message: "NDA ID is missing." } };
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
    return { props: { ok: false, message: "Invalid NDA ID." } };
  }

  return { props: { ok: true, nda: data } };
};