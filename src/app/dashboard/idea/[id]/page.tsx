'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import ActionButtons from './ActionButtons'; // ✅ default import

// Make sure this matches the type in ActionButtons.tsx
type Status = 'pending' | 'viewed' | 'confirmed' | 'blocked';

type Idea = {
  id: string;
  title: string;
  tagline?: string | null;
  impact?: string | null;
  category?: string | null;
  status?: Status | null;
};

type Asset = {
  id: string;
  idea_id: string;
  kind: 'image' | 'video' | 'pdf';
  url: string;
};

export default function IdeaDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [idea, setIdea] = useState<Idea | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // fetch idea + assets
  useEffect(() => {
    let cancelled = false;
    if (!id) return;

    (async () => {
      setLoading(true);
      const [
        { data: ideaRow, error: ideaErr },
        { data: assetRows, error: assetErr },
      ] = await Promise.all([
        supabase
          .from('ideas')
          .select('id,title,tagline,impact,category,status')
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
        setAssets((assetRows || []) as Asset[]);
      } else {
        setAssets((assetRows || []) as Asset[]);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // When opened, mark as viewed if still pending
  useEffect(() => {
    if (!idea || !idea.id) return;
    if (idea.status && idea.status !== 'pending') return;

    (async () => {
      const { error } = await supabase
        .from('ideas')
        .update({ status: 'viewed' })
        .eq('id', idea.id);

      if (!error) {
        setIdea((prev) => (prev ? { ...prev, status: 'viewed' } : prev));
      }
    })();
  }, [idea]);

  const status: Status = (idea?.status ?? 'pending') as Status;

  const images = useMemo(
    () => assets.filter((a) => a.kind === 'image'),
    [assets]
  );
  const videos = useMemo(
    () => assets.filter((a) => a.kind === 'video'),
    [assets]
  );
  const pdfs = useMemo(
    () => assets.filter((a) => a.kind === 'pdf'),
    [assets]
  );

  const statusBadgeClass =
    status === 'confirmed'
      ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
      : status === 'blocked'
      ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30'
      : status === 'viewed'
      ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
      : 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30'; // pending

  if (!id) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <p className="text-rose-300">Invalid idea id.</p>
          <Link
            href="/dashboard"
            className="mt-3 inline-block text-emerald-300 underline"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-6 pt-24 pb-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top row: back + status */}
        <div className="flex items-center justify-between text-sm text-white/70">
          <Link
            href="/dashboard"
            className="text-emerald-300 hover:text-emerald-200"
          >
            ← Back to dashboard
          </Link>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadgeClass}`}
          >
            {status}
          </span>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 md:p-8 shadow-lg shadow-black/40">
          {loading ? (
            <div className="py-20 text-center text-white/70">Loading…</div>
          ) : !idea ? (
            <div className="text-rose-300 text-center">Idea not found.</div>
          ) : (
            <>
              {/* Header: title + actions */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-white/40 mb-1">
                    {idea.category ?? 'Uncategorized'}
                  </p>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-300 break-words">
                    {idea.title || 'Untitled'}
                  </h1>
                  {idea.tagline && (
                    <p className="mt-2 text-white/80 break-words">
                      {idea.tagline}
                    </p>
                  )}
                  {idea.impact && (
                    <p className="mt-1 text-sm text-white/60 break-words">
                      {idea.impact}
                    </p>
                  )}
                </div>

                {/* Actions – stack on mobile, row on desktop */}
                <div className="flex flex-col gap-3 md:items-end">
                  <ActionButtons ideaId={idea.id} currentStatus={status} />
                </div>
              </div>

              {/* Media / Empty */}
              <div className="mt-2">
                {images.length === 0 &&
                videos.length === 0 &&
                pdfs.length === 0 ? (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-white/70 text-center">
                    No media uploaded for this idea.
                  </div>
                ) : (
                  <div className="space-y-8">
                    {images.length > 0 && (
                      <div>
                        <h3 className="mb-3 text-lg font-semibold text-emerald-300">
                          Images
                        </h3>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                          {images.map((img) => (
                            <div
                              key={img.id}
                              className="overflow-hidden rounded-lg border border-white/10 bg-white/5"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt=""
                                className="h-56 w-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {videos.length > 0 && (
                      <div>
                        <h3 className="mb-3 text-lg font-semibold text-emerald-300">
                          Videos
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {videos.map((v) => (
                            <div
                              key={v.id}
                              className="overflow-hidden rounded-lg border border-white/10 bg-white/5 p-2"
                            >
                              <video
                                src={v.url}
                                controls
                                className="h-72 w-full rounded-md"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {pdfs.length > 0 && (
                      <div>
                        <h3 className="mb-3 text-lg font-semibold text-emerald-300">
                          PDFs
                        </h3>
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
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}