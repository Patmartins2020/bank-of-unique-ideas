// src/app/investor/ideas/[id]/page.tsx
import { createClient } from "@supabase/supabase-js";

type PageProps = {
  params: { id?: string };
};

function getEnv() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return { SUPABASE_URL, SUPABASE_ANON_KEY };
}

function makeSupabase(url: string, anonKey: string) {
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

export default async function InvestorIdeaPage({ params }: PageProps) {
  const id = (params?.id || "").trim();

  if (!id) {
    return (
      <main className="min-h-screen bg-[#020617] text-white px-6 pt-24 pb-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-red-400">Missing Idea ID</h1>
          <p className="text-white/80 mt-2">
            The route parameter <code>[id]</code> was not provided.
          </p>
        </div>
      </main>
    );
  }

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = getEnv();

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return (
      <main className="min-h-screen bg-[#020617] text-white px-6 pt-24 pb-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-red-400">Server misconfigured</h1>
          <p className="text-white/80 mt-2">
            Missing <code>NEXT_PUBLIC_SUPABASE_URL</code> or{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </main>
    );
  }

  const sb = makeSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);

  // NOTE: adjust table/columns if yours differs.
  const { data, error } = await sb
    .from("ideas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <main className="min-h-screen bg-[#020617] text-white px-6 pt-24 pb-10">
        <div className="max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl font-extrabold text-red-400">Error loading idea</h1>
          <p className="text-white/80">{error.message}</p>
          <div className="text-white/60 text-sm">
            Idea ID: <code>{id}</code>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#020617] text-white px-6 pt-24 pb-10">
        <div className="max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl font-extrabold text-yellow-300">Idea not found</h1>
          <p className="text-white/80">
            No record in <code>ideas</code> matched this ID.
          </p>
          <div className="text-white/60 text-sm">
            Idea ID: <code>{id}</code>
          </div>
        </div>
      </main>
    );
  }

  const title = (data as any)?.title || "Untitled Idea";
  const summary =
    (data as any)?.summary ||
    (data as any)?.description ||
    (data as any)?.overview ||
    "";

  return (
    <main className="min-h-screen bg-[#020617] text-white px-6 pt-24 pb-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold text-emerald-300">{title}</h1>
          <div className="text-white/60 text-sm">
            Idea ID: <code>{id}</code>
          </div>
        </header>

        {summary ? (
          <section className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold mb-2">Summary</h2>
            <p className="text-white/85 leading-relaxed">{summary}</p>
          </section>
        ) : null}

        {/* Temporary debug: shows the exact fields coming back from Supabase */}
        <section className="rounded-xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-lg font-semibold mb-2">Idea Data (Debug)</h2>
          <pre className="text-xs whitespace-pre-wrap break-words text-white/80">
            {JSON.stringify(data, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}