'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type AssetKind = 'image' | 'video' | 'pdf';

export default function SubmitPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  // ================= FORM STATE =================
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [impact, setImpact] = useState('');
  const [category, setCategory] = useState('Smart Security & Tech');

  // Optional paid services
  const [featureFrontPage, setFeatureFrontPage] = useState(false);
  const [requestPPA, setRequestPPA] = useState(false);

  // Files
  const [images, setImages] = useState<FileList | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ================= PRICING =================
  const BASE_PRICE = 199;
  const FEATURE_PRICE = 1900;
  const PPA_PRICE = 19900;

  const totalPriceCents =
    BASE_PRICE +
    (featureFrontPage ? FEATURE_PRICE : 0) +
    (requestPPA ? PPA_PRICE : 0);

  // ================= PREVIEWS =================
  const imgPreviews = useMemo(
    () => (images ? Array.from(images).map(f => URL.createObjectURL(f)) : []),
    [images]
  );

  useEffect(() => {
    return () => {
      imgPreviews.forEach(u => URL.revokeObjectURL(u));
    };
  }, [imgPreviews]);

  // ================= HELPERS =================
  function extOf(name: string) {
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  async function uploadFile(file: File, kind: AssetKind, ideaId: string) {
    const ext = extOf(file.name) || kind;
    const path = `ideas/${ideaId}/${kind}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('Idea-assets')
      .upload(path, file);

    if (upErr) throw new Error(upErr.message);

    const { data } = supabase.storage.from('Idea-assets').getPublicUrl(path);
    const url = data?.publicUrl;

    if (!url) throw new Error('Could not generate public URL');

    const { error: dbErr } = await supabase.from('idea_assets').insert({
      idea_id: ideaId,
      kind,
      url,
    });

    if (dbErr) throw new Error(dbErr.message);
  }

  // ================= SUBMIT =================
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // 1️⃣ Create idea record
      const { data: idea, error: insErr } = await supabase
        .from('ideas')
        .insert([
          {
            user_id: user.id,
            title: title.trim(),
            tagline: tagline.trim() || null,
            impact: impact.trim() || null,
            category,
            status: 'pending',
            protected: true,
            payment_status: 'requires_payment',
            price_cents: totalPriceCents,
            feature_requested: featureFrontPage,
            ppa_requested: requestPPA,
          },
        ])
        .select('id')
        .single();

      if (insErr) throw new Error(insErr.message);
      const ideaId = idea.id;

      // 2️⃣ Upload assets BEFORE payment
      const uploads: Promise<void>[] = [];

      if (images) {
        for (const file of Array.from(images)) {
          uploads.push(uploadFile(file, 'image', ideaId));
        }
      }

      if (video) uploads.push(uploadFile(video, 'video', ideaId));
      if (pdf) uploads.push(uploadFile(pdf, 'pdf', ideaId));

      if (uploads.length) await Promise.all(uploads);

      // 3️⃣ Start Stripe checkout
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId }),
      });

      const data = await res.json();
      if (!data?.ok || !data?.url) {
        throw new Error(data?.error || 'Stripe checkout failed.');
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
  };

  // ================= UI =================
  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 20 }}>
          Submit Your Idea
        </h1>

        <form
          onSubmit={onSubmit}
          style={{
            background: 'rgba(255,255,255,0.08)',
            padding: 24,
            borderRadius: 16,
            display: 'grid',
            gap: 16,
          }}
        >
          <input
            style={inputStyle}
            placeholder="Idea Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />

          <input
            style={inputStyle}
            placeholder="Tagline"
            value={tagline}
            onChange={e => setTagline(e.target.value)}
          />

          <textarea
            style={{ ...inputStyle, minHeight: 100 }}
            placeholder="Impact / Problem Solved"
            value={impact}
            onChange={e => setImpact(e.target.value)}
          />

          <select
            style={inputStyle}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option>Smart Security & Tech</option>
            <option>Eco & Sustainability</option>
            <option>Mobility & Safety</option>
            <option>Home & Lifestyle</option>
            <option>General</option>
          </select>

          {/* Optional Services */}
          <div>
            <h3 style={{ marginBottom: 8 }}>Optional Services</h3>

            <label style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={featureFrontPage}
                onChange={e => setFeatureFrontPage(e.target.checked)}
              />{' '}
              Feature on Homepage (30 days) — $19
            </label>

            <label style={{ display: 'block', marginTop: 6 }}>
              <input
                type="checkbox"
                checked={requestPPA}
                onChange={e => setRequestPPA(e.target.checked)}
              />{' '}
              PPA Filing Assistance — $199
            </label>
          </div>

          {/* Price Summary */}
          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              padding: 10,
              borderRadius: 8,
            }}
          >
            <div>Submission: $1.99</div>
            {featureFrontPage && <div>Homepage Feature: $19</div>}
            {requestPPA && <div>PPA Assistance: $199</div>}
            <strong>Total: ${(totalPriceCents / 100).toFixed(2)}</strong>
          </div>

          {error && <p style={{ color: '#f87171' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 20px',
              borderRadius: 50,
              border: 'none',
              background: loading ? '#555' : '#00f2fe',
              color: '#000',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Processing…' : `Submit & Pay $${(totalPriceCents / 100).toFixed(2)}`}
          </button>
        </form>
      </div>
    </main>
  );
}