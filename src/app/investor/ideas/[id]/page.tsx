import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type Idea = {
  id: string;
  title?: string | null;
  tagline?: string | null;
  impact?: string | null;
  category?: string | null;
  status?: string | null;
  protected?: boolean | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  payment_status?: string | null;
  price_cents?: number | null;
  user_id?: string | null;
};

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

async function getIdeaById(id: string): Promise<{ idea: Idea | null; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    // ✅ IMPORTANT: do NOT select "summary" because your table doesn't have it.
    const { data, error } = await supabase
      .from("ideas")
      .select(
        "id,title,tagline,impact,category,status,protected,submitted_at,reviewed_at,reviewed_by,payment_status,price_cents,user_id"
      )
      .eq("id", id)
      .maybeSingle();

    if (error) return { idea: null, error: error.message };
    return { idea: (data as Idea) ?? null };
  } catch (e: any) {
    return { idea: null, error: e?.message ?? "Unknown error" };
  }
}

export default async function InvestorIdeaPage({
  params,
}: {
  params: { id: string };
}) {
  const ideaId = params?.id;

  if (!ideaId) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <h1 className="text-3xl font-bold text-red-400">Missing Idea ID</h1>
        <p className="mt-2 text-slate-300">
          The route parameter <span className="font-mono">[id]</span> was not provided.
        </p>
        <Link href={`/investor/ideas/${ideaId}`}>View</Link>
        <Link href="/investor/ideas" className="inline-block mt-6 underline text-emerald-300">
          Back to ideas
        </Link>
      </main>
    );
  }

  const { idea, error } = await getIdeaById(ideaId);

  if (!idea && !error) notFound();

  const ndaUrl = "/nda-template/NDA.pdf"; // ✅ public/nda-template/NDA.pdf

  // If there was a DB error, show it clearly (instead of breaking)
  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <h1 className="text-3xl font-bold text-red-400">Failed to load idea</h1>
        <p className="mt-2 text-slate-300">{error}</p>

        <div className="mt-6 flex gap-3">
          <Link href="/investor/ideas" className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700">
            Back to ideas
          </Link>
          <a
            href={ndaUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 font-semibold"
          >
            Download NDA
          </a>
        </div>
      </main>
    );
  }

  if (!idea) notFound();

  const title = idea.title ?? "Untitled idea";
  const tagline = idea.tagline ?? "";
  const description = idea.impact ?? ""; // ✅ FIX: you have "impact", not "summary"
  const category = idea.category ?? "";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto p-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <div className="text-slate-300 text-sm">Bank of Unique Ideas</div>
            <h1 className="text-4xl font-extrabold text-emerald-300">Investor Idea Page</h1>
            <p className="mt-2 text-slate-300">
              Captured Idea ID: <span className="font-mono text-slate-100">{ideaId}</span>
            </p>
          </div>

          <Link
            href="/investor/ideas"
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700"
          >
            Back to ideas
          </Link>
        </header>

        <section className="mt-8 rounded-xl bg-slate-900/60 border border-slate-800 p-6">
          <h2 className="text-2xl font-bold">{title}</h2>

          {tagline ? <p className="mt-2 text-slate-300">{tagline}</p> : null}

          {category ? (
            <p className="mt-3 text-sm text-slate-400">
              Category: <span className="text-slate-200">{category}</span>
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={ndaUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 font-semibold"
            >
              Download NDA (PDF)
            </a>

            <Link href="/" className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700">
              Home
            </Link>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold">Description</h3>

            {description ? (
              <p className="mt-2 text-slate-200 leading-relaxed">{description}</p>
            ) : (
              <div className="mt-2 rounded-lg bg-slate-950/60 border border-slate-800 p-4">
                <p className="text-amber-300 font-semibold">
                  No impact/description field found.
                </p>
                <details className="mt-3">
                  <summary className="cursor-pointer text-slate-300">
                    Show raw idea data (debug)
                  </summary>
                  <pre className="mt-3 text-xs text-slate-200 overflow-auto">
                    {JSON.stringify(idea, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}