'use client';

import { useEffect, useState } from 'react';
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
};

export default function EditMyIdeaPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [error, setError] = useState<string | null>(null);

  // form
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [impact, setImpact] = useState('');
  const [category, setCategory] = useState('Smart Security & Tech');

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

      // must be inventor
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if ((prof?.role ?? 'inventor') !== 'inventor') {
        router.replace('/');
        return;
      }

      const { data: ideaRow, error: ideaErr } = await supabase
        .from('ideas')
        .select('id,user_id,title,tagline,impact,category,status')
        .eq('id', id)
        .single();

      if (cancelled) return;

      if (ideaErr || !ideaRow) {
        setError('Idea not found.');
        setIdea(null);
        setLoading(false);
        return;
      }

      if (ideaRow.user_id !== user.id) {
        router.replace('/my-ideas');
        return;
      }

      const status = (ideaRow.status ?? 'pending') as IdeaStatus;

      // Edit ONLY if pending
      if (status !== 'pending') {
        router.replace(`/my-ideas/${id}`);
        return;
      }

      setIdea(ideaRow as Idea);

      setTitle(ideaRow.title ?? '');
      setTagline(ideaRow.tagline ?? '');
      setImpact(ideaRow.impact ?? '');
      setCategory(ideaRow.category ?? 'Smart Security & Tech');

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, supabase, router]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!idea) return;

    setSaving(true);
    setError(null);

    try {
      const { error: upErr } = await supabase
        .from('ideas')
        .update({
          title: title.trim(),
          tagline: tagline.trim() || null,
          impact: impact.trim() || null,
          category: category || null,
        })
        .eq('id', idea.id);

      if (upErr) throw upErr;

      router.push(`/my-ideas/${idea.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-6 pt-24 pb-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between text-sm text-white/70">
          <Link href={`/my-ideas/${id}`} className="text-emerald-300 hover:text-emerald-200">
            ← Back to details
          </Link>
          <span className="text-white/60">Edit allowed only while Pending</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 md:p-8 shadow-lg shadow-black/40">
          <h1 className="text-2xl font-extrabold text-emerald-300">Edit Idea</h1>

          {loading && <p className="mt-4 text-white/70">Loading…</p>}

          {error && (
            <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">
              {error}
            </div>
          )}

          {!loading && idea && (
            <form onSubmit={onSave} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Tagline</label>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Impact</label>
                <textarea
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  className="w-full min-h-[120px] rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
                >
                  <option>Smart Security & Tech</option>
                  <option>Eco & Sustainability</option>
                  <option>Home & Lifestyle</option>
                  <option>Mobility & Safety</option>
                  <option>General</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}