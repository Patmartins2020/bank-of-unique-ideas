// src/app/investor/ideas/[id]/page.tsx

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

type IdeaRow = {
  id: string;
  title?: string | null;
  summary?: string | null;
  description?: string | null;
  created_at?: string | null;
  // add any other columns you have in your "ideas" table
};

function getEnv() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return { SUPABASE_URL, SUPABASE_ANON_KEY };
}

function makeSupabaseClient(url: string, anonKey: string) {
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

export default async function InvestorIdeaPage({
  params,
}: {
  params: { id?: string };
}) {
  const ideaId = (params?.id || "").trim();

  // 1) If route param isn't captured, show the exact problem (this is what you saw before)
  if (!ideaId) {
    return (
      <main className="min-h-screen bg-[#020617] text-white px-6 pt-20 pb-10">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl font-extrabold text-red-400">
            Missing Idea ID
          </h1>
          <p className="text-white/80">
            The route parameter <code className="text-white">[id]</code> was not captured.
          </p>
          <p className="text-white/70">
            Confirm the file is located at:
            <br />
            <code className="text-white">
              src/app/investor/ideas/[id]/page.tsx
            </code>
          </p>
          <Link
            href="/"
            className="inline-block mt-4 rounded-lg bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-500"
          >
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  // 2) Validate Supabase env
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = getEnv();

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return (
      <main className="min-h-screen bg-[#020617] text-white px-6 pt-20 pb-10">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl font-extrabold text-red-400">
            Server configuration error
          </h1>
          <p className="text-white/80">
            Missing Supabase environment variables.
          </p>
          <p className="text-white/70">
            Ensure these are set in Vercel:
          </p>
          <ul className="list-disc pl-6 text-white/70 space-y-1">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          </ul>
        </div>
      </main>
    );
  }

  // 3) Fetch idea from Supabase
  const sb = makeSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: idea, error } = await sb
    .from("ideas")
    .select("id,title,summary,description,created_at")
    .eq("id", ideaId)
    .maybeSingle<IdeaRow>();

  // 4) Handle errors / not found
  if (error) {
    return (
      <main className="min-h-screen bg-[#020617] text-white px-6 pt-20 pb-10">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl font-extrabold text-red-400">
            Error loading idea
          </h1>
          <p className="text-white/80">
            Supabase error: <span className="text-red-300">{error.message}</span>
          </p>
          <p className="text-white/70">
            Captured idea ID: <code className="text-white">{ideaId}</code>
          </p>
          <Link
            href="/"
            className="inline-block mt-4 rounded-lg bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-500"
          >
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  if (!idea) {
    return (
      <main className="min-h-screen bg-[#020617] text-white px-6 pt-20 pb-10">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl font-extrabold text-red-400">
            Idea not found
          </h1>
          <p className="text-white/80">
            No idea exists with this ID:
          </p>
          <p>
            <code className="text-white">{ideaId}</code>
          </p>
          <Link
            href="/"
            className="inline-block mt-4 rounded-lg bg-emerald-600 px-4 py-2 font-semibold hover:bg-emerald-500"
          >
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  // 5) Render idea page
  return (
    <main className="min-h-screen bg-[#020617] text-white px-6 pt-20 pb-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-300">
              {idea.title || "Untitled Idea"}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Idea ID: <code className="text-white/80">{idea.id}</code>
              {idea.created_at ? (
                <>
                  {" "}
                  • Created:{" "}
                  <span className="text-white/70">
                    {new Date(idea.created_at).toLocaleString()}
                  </span>
                </>
              ) : null}
            </p>
          </div>

          <Link
            href="/"
            className="shrink-0 rounded-lg bg-white/10 px-4 py-2 font-semibold hover:bg-white/15"
          >
            Back
          </Link>
        </div>

        {idea.summary ? (
          <section className="rounded-2xl bg-white/5 p-5 border border-white/10">
            <h2 className="text-lg font-bold text-white">Summary</h2>
            <p className="text-white/80 mt-2 leading-relaxed">{idea.summary}</p>
          </section>
        ) : null}

        <section className="rounded-2xl bg-white/5 p-5 border border-white/10">
          <h2 className="text-lg font-bold text-white">Description</h2>
          <p className="text-white/80 mt-2 leading-relaxed whitespace-pre-wrap">
            {idea.description || "No description provided."}
          </p>
        </section>
      </div>
    </main>
  );
}