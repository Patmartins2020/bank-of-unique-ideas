'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type IdeaStatus = 'pending' | 'viewed' | 'confirmed' | 'blocked' | 'deleted' | string;

type Idea = {
  id: string;
  user_id: string;
  title: string | null;
  tagline: string | null;
  impact: string | null;
  category: string | null;
  status: IdeaStatus | null;
  created_at?: string | null;
};

type Asset = {
  id: string;
  idea_id: string;
  kind: 'image' | 'video' | 'pdf';
  url: string;
};

export default function MyIdeaDetailsPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;

    (async () => {
      setLoading(true);
      setError(null);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        router.replace('/login');
        return;
      }

      // Must be inventor
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if ((prof?.role ?? 'inventor') !== 'inventor') {
        router.replace('/');
        return;
      }

      // Load idea (must belong to this inventor)
      const { data: ideaRow, error: ideaErr } = await supabase
        .from('ideas')
        .select('id,user_id,title,tagline,impact,category,status,created_at')
        .eq('id', id)
        .single();

      if (cancelled) return;

      if (ideaErr || !ideaRow) {
        setError('Idea not found.');
        setIdea(null);
        setAssets([]);
        setLoading(false);
        return;
      }

      if (ideaRow.user_id !== user.id) {
        // not owner
        router.replace('/my-ideas');
        return;
      }

      setIdea(ideaRow as Idea);

      // Load assets
      const { data: assetRows, error: assetErr } = await supabase
        .from('idea_assets')
        .select('id,idea_id,kind,url')
        .eq('idea_id', id);

      if (assetErr) setAssets([]);
      else setAssets((assetRows ?? []) as Asset[]);

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, supabase, router]);

  const status = (idea?.status ?? 'pending') as IdeaStatus;
  const images = useMemo(() => assets.filter((a) => a.kind === 'image'), [assets]);
  const videos = useMemo(() => assets.filter((a) => a.kind === 'video'), [assets]);
  const pdfs = useMemo(() => assets.filter((a) => a.kind === 'pdf'), [assets]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-6 pt-24 pb-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between text-sm text-white/70">
          <Link href="/my-ideas" className="text-emerald-300 hover:text-emerald-200">
            ← Back to My Ideas
          </Link>
          <span className="text-white/60">Status: <b className="text-white">{status}</b></span>
        </div>

        {loading && <p className="text-white/70">Loading…</p>}

        {error && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && idea && (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 md:p-8 shadow-lg shadow-black/40">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-white/50">
                  {idea.category ?? 'Uncategorized'}
                </p>
                <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-emerald-300 break-words">
                  {idea.title ?? 'Untitled idea'}
                </h1>
                {idea.tagline && <p className="mt-2 text-white/80 break-words">{idea.tagline}</p>}
                {idea.impact && <p className="mt-2 text-white/60 break-words">{idea.impact}</p>}
              </div>

              {status === 'pending' && (
                <Link
                  href={`/my-ideas/${idea.id}/edit`}
                  className="inline-flex w-fit rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-300"
                >
                  Edit (Pending only)
                </Link>
              )}
            </div>

            {/* Media */}
            <div className="mt-8 space-y-8">
              {images.length > 0 && (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-emerald-300">Images</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {images.map((img) => (
                      <div key={img.id} className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="h-56 w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {videos.length > 0 && (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-emerald-300">Videos</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {videos.map((v) => (
                      <div key={v.id} className="overflow-hidden rounded-lg border border-white/10 bg-white/5 p-2">
                        <video src={v.url} controls className="h-72 w-full rounded-md" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pdfs.length > 0 && (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-emerald-300">PDFs</h3>
                  <ul className="space-y-2">
                    {pdfs.map((p) => (
                      <li key={p.id}>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:underline"
                        >
                          Open PDF
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {images.length === 0 && videos.length === 0 && pdfs.length === 0 && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-white/70 text-center">
                  No media uploaded for this idea.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}