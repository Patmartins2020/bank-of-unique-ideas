import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

type IdeaRow = {
  id: string;
  title: string | null;
  category: string | null;
  status: string | null;
  protected: boolean | null;

  tagline?: string | null;
  impact?: string | null;
  summary?: string | null;
  description?: string | null;

  created_at?: string | null;
};

type ProfileRow = {
  id: string;
  role: string | null;
  full_name: string | null;
};

function pickSummary(i: IdeaRow) {
  return (
    i.summary?.trim() ||
    i.description?.trim() ||
    i.impact?.trim() ||
    i.tagline?.trim() ||
    ''
  );
}

export default async function InvestorIdeaPage({
  params,
}: {
  params: { id: string };
}) {
  const ideaId = params?.id;
  if (!ideaId) notFound();

  const supabase = createServerComponentClient({ cookies });

  // Must be logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Must be investor
  const { data: prof } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>();

  const role =
    (prof?.role ?? (user.user_metadata as any)?.role ?? 'investor') as string;

  if (role !== 'investor') redirect('/');

  // Load idea (confirmed only)
  const { data: idea, error } = await supabase
    .from('ideas')
    .select(
      'id, title, category, status, protected, tagline, impact, summary, description, created_at',
    )
    .eq('id', ideaId)
    .eq('status', 'confirmed')
    .maybeSingle<IdeaRow>();

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-6 pt-24 pb-10">
        <div className="max-w-3xl mx-auto rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-rose-200">
          Failed to load idea: {error.message}
        </div>
      </main>
    );
  }

  if (!idea) notFound();

  const title = idea.title ?? (idea.protected ? 'Protected Idea' : 'Untitled');
  const summary = pickSummary(idea);

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-6 pt-24 pb-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-300">
              Investor Idea Page
            </h1>
            <p className="text-white/70 mt-1">
              Captured Idea ID:{' '}
              <span className="font-mono text-white/85">{idea.id}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/investor/ideas"
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Back to ideas
            </Link>

            <a
              href="/nda-template/NDA.pdf"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Download NDA
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-lg shadow-black/30">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-bold text-white/95">{title}</h2>

            {idea.protected ? (
              <span className="rounded-full px-3 py-1 text-xs font-semibold bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/30">
                🔒 Protected
              </span>
            ) : (
              <span className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30">
                Confirmed
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-emerald-300">
            {idea.category ?? 'General'}
          </p>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
            {summary ? (
              <p className="text-white/85 leading-relaxed">{summary}</p>
            ) : (
              <p className="text-white/70">
                No summary/description found. Your idea details appear to be stored
                under fields like <span className="font-mono">impact</span> or{' '}
                <span className="font-mono">tagline</span>.
              </p>
            )}
          </div>

          <details className="mt-5">
            <summary className="cursor-pointer text-sm text-white/70 hover:text-white">
              Show raw idea data (debug)
            </summary>
            <pre className="mt-3 overflow-auto rounded-xl border border-white/10 bg-black/50 p-4 text-xs text-white/80">
{JSON.stringify(idea, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </main>
  );
}