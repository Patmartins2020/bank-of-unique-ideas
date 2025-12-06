'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

type Status = 'pending' | 'viewed' | 'approved' | 'rejected';

type Idea = {
  id: string;
  title: string;
  tagline?: string | null;
  impact?: string | null;
  category?: string | null;
  review_status?: Status | null;
};

type Asset = {
  id: string;
  idea_id: string;
  kind: 'image' | 'video' | 'pdf';
  url: string;
};

export default function IdeaDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [idea, setIdea] = useState<Idea | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // fetch idea + assets
  useEffect(() => {
    let cancelled = false;
    if (!id) return;

    (async () => {
      setLoading(true);
      const [{ data: ideaRow, error: ideaErr }, { data: assetRows, error: assetErr }] =
        await Promise.all([
          supabase
            .from('ideas')
            .select('id,title,tagline,impact,category,review_status')
            .eq('id', id)
            .single(),
          supabase
            .from('idea_assets')
            .select('id,idea_id,kind,url')
            .eq('idea_id', id),
        ]);

      if (cancelled) return;

      if (ideaErr) {
        console.error('Idea fetch error:', ideaErr.message);
        setIdea(null);
      } else {
        setIdea(ideaRow as Idea);
      }

      if (assetErr) {
        console.error('Assets fetch error:', assetErr.message);
        setAssets([]);
      } else {
        setAssets((assetRows || []) as Asset[]);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const status: Status = (idea?.review_status ?? 'pending') as Status;

  const images = useMemo(() => assets.filter((a) => a.kind === 'image'), [assets]);
  const videos = useMemo(() => assets.filter((a) => a.kind === 'video'), [assets]);
  const pdfs = useMemo(() => assets.filter((a) => a.kind === 'pdf'), [assets]);

  const statusBadgeClass =
    status === 'approved'
      ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
      : status === 'viewed'
      ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
      : status === 'rejected'
      ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30'
      : 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30';

  async function markViewed() {
    if (!idea) return;
    setSaving(true);
    const { error } = await supabase
      .from('ideas')
      .update({ review_status: 'viewed', reviewed_at: new Date().toISOString() })
      .eq('id', idea.id);
    if (!error) setIdea((i) => (i ? { ...i, review_status: 'viewed' } : i));
    setSaving(false);
  }

  async function approveIdea() {
    if (!idea) return;
    setSaving(true);
    const { error } = await supabase
      .from('ideas')
      .update({ review_status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', idea.id);
    if (!error) setIdea((i) => (i ? { ...i, review_status: 'approved' } : i));
    setSaving(false);
  }

  async function deleteIdea() {
    if (!idea) return;
    if (!confirm('Delete this idea permanently?')) return;
    setSaving(true);
    const { error } = await supabase.from('ideas').delete().eq('id', idea.id);
    setSaving(false);
    if (!error) router.push('/dashboard');
  }

  if (!id) {
    return (
      <main className="min-h-screen bg-[#0b1120] text-white">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-rose-300">Invalid idea id.</p>
          <Link href="/dashboard" className="mt-3 inline-block text-emerald-300 underline">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b1120] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="text-emerald-300 transition hover:text-emerald-200">
            ← Back to dashboard
          </Link>
          <h1 className="text-lg font-semibold text-white/90">Idea Detail</h1>
          <div />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        {loading ? (
          <div className="py-20 text-center text-white/70">Loading…</div>
        ) : !idea ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-rose-300">
            Idea not found.
          </div>
        ) : (
          <>
            {/* Title + meta */}
            <div className="mb-6">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="text-sm text-white/70">
                  {idea.category ?? 'Uncategorized'} •{' '}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass}`}>
                  {status}
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-emerald-400">{idea.title || 'Untitled'}</h2>
              {idea.tagline && <p className="mt-2 text-white/80">{idea.tagline}</p>}
              {idea.impact && <p className="mt-1 text-white/60">{idea.impact}</p>}
            </div>

            {/* Action buttons */}
            <div className="mb-8 flex flex-wrap gap-3">
              <button
                onClick={markViewed}
                disabled={saving || status === 'viewed' || status === 'approved'}
                className="rounded-md bg-white/8 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10 disabled:opacity-50"
              >
                Mark Viewed
              </button>

              <button
                onClick={approveIdea}
                disabled={saving || status === 'approved'}
                className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-50"
              >
                Approve
              </button>

              <button
                onClick={deleteIdea}
                disabled={saving}
                className="rounded-md bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-50"
              >
                Delete
              </button>
            </div>

            {/* Media */}
            {(images.length > 0 || videos.length > 0 || pdfs.length > 0) && (
              <div className="space-y-8">
                {images.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-emerald-300">Images</h3>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      {images.map((img) => (
                        <div
                          key={img.id}
                          className="overflow-hidden rounded-lg border border-white/10 bg-white/5"
                        >
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
                        <div
                          key={v.id}
                          className="overflow-hidden rounded-lg border border-white/10 bg-white/5 p-2"
                        >
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
                            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 underline-offset-2 hover:underline"
                          >
                            Open PDF
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {(images.length === 0 && videos.length === 0 && pdfs.length === 0) && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-white/70">
                No media uploaded for this idea.
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
