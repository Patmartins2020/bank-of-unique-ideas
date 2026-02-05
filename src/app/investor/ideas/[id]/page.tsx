import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type Props = {
  params: { id: string };
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function InvestorIdeaPage({ params }: Props) {
  const ideaId = params?.id;

  // If you ever see this in production, it means the route/file is wrong.
  if (!ideaId) notFound();

  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", ideaId)
    .single();

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <h1 className="text-3xl font-bold text-red-400">Failed to load idea</h1>
        <p className="mt-3 opacity-80">{error?.message ?? "Idea not found"}</p>

        <Link href="/investor/ideas" className="inline-block mt-6 underline text-emerald-300">
          Back to ideas
        </Link>
      </main>
    );
  }

  // Your database uses "impact" and "tagline" (from your debug screenshot),
  // and it does NOT have ideas.summary.
  const description = data.summary ?? data.description ?? data.impact ?? data.tagline ?? null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <h1 className="text-3xl font-bold">{data.title ?? "Untitled idea"}</h1>

      <p className="mt-3 text-slate-300">
        Captured Idea ID: <span className="font-mono">{ideaId}</span>
      </p>

      <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-semibold">Description</h2>

        {description ? (
          <p className="mt-3 text-slate-200 whitespace-pre-line">{description}</p>
        ) : (
          <p className="mt-3 text-slate-400">No description field found.</p>
        )}
      </div>

      <div className="mt-8 flex gap-6">
        <Link href="/investor/ideas" className="underline text-emerald-300">
          Back to ideas
        </Link>

        {/* IMPORTANT: public files are served WITHOUT /public */}
        <a href="/nda-template/NDA.pdf" className="underline text-emerald-300" target="_blank" rel="noreferrer">
          Download NDA
        </a>
      </div>
    </main>
  );
}