// src/app/investor/ideas/[id]/page.tsx
import { createClient } from "@supabase/supabase-js";

type Params = { id: string };
type PageProps = { params: Params | Promise<Params> };

function getEnv() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return { SUPABASE_URL, ANON_KEY };
}

export default async function InvestorIdeaPage({ params }: PageProps) {
  const { id } = await Promise.resolve(params);

  const { SUPABASE_URL, ANON_KEY } = getEnv();

  if (!id) {
    return (
      <main className="min-h-screen bg-[#020617] text-white px-6 py-10">
        <h1 className="text-3xl font-extrabold text-red-400">Missing Idea ID</h1>
        <p className="mt-3 text-white/70">
          The route parameter <code>[id]</code> was not captured.
        </p>
      </main>
    );
  }

  if (!SUPABASE_URL || !ANON_KEY) {
    return (
      <main className="min-h-screen bg-[#020617] text-white px-6 py-10">
        <h1 className="text-3xl font-extrabold text-red-400">Server Config Error</h1>
        <p className="mt-3 text-white/70">
          Missing <code>NEXT_PUBLIC_SUPABASE_URL</code> or{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
        </p>
      </main>
    );
  }

  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  });

  // Adjust fields here to match your "ideas" table columns
  const { data: idea, error } = await supabase
    .from("ideas")
    .select("id,title,summary,created_at")
    .eq("id", id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-[#020617] text-white px-6 py-10">
      <header className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-emerald-300">
          Investor Idea Page
        </h1>
        <p className="mt-2 text-white/70">
          Captured Idea ID:{" "}
          <code className="rounded bg-black/40 px-2 py-1">{id}</code>
        </p>
      </header>

      <section className="max-w-3xl mx-auto mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        {error && (
          <>
            <h2 className="text-xl font-bold text-red-400">Failed to load idea</h2>
            <pre className="mt-3 text-sm text-white/70 whitespace-pre-wrap">
              {error.message}
            </pre>
          </>
        )}

        {!error && !idea && (
          <>
            <h2 className="text-xl font-bold text-yellow-300">Idea not found</h2>
            <p className="mt-3 text-white/70">
              No record exists in <code>ideas</code> with that id.
            </p>
          </>
        )}

        {!error && idea && (
          <>
            <h2 className="text-2xl font-bold">{idea.title || "Untitled Idea"}</h2>
            <p className="mt-4 text-white/80">{idea.summary || "No summary yet."}</p>

            <p className="mt-6 text-xs text-white/50">
              Created: {idea.created_at ? new Date(idea.created_at).toLocaleString() : "—"}
            </p>
          </>
        )}
      </section>
    </main>
  );
}