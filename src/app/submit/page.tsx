'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type AssetKind = 'image' | 'video' | 'pdf';

export default function SubmitPage() {

  const router = useRouter();
  const supabase = createClientComponentClient();

  /* ================= FORM STATE ================= */

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [impact, setImpact] = useState('');
  const [category, setCategory] = useState('Smart Security & Tech');

  const [featureFrontPage, setFeatureFrontPage] = useState(false);
  const [requestPPA, setRequestPPA] = useState(false);

  const [attested, setAttested] = useState(false);

  const [images, setImages] = useState<FileList | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= PRICING ================= */

  const BASE_PRICE = 199;
  const FEATURE_PRICE = 1900;
  const PPA_PRICE = 19900;

  const totalPriceCents =
    BASE_PRICE +
    (featureFrontPage ? FEATURE_PRICE : 0) +
    (requestPPA ? PPA_PRICE : 0);

  /* ================= IMAGE PREVIEWS ================= */

  const imgPreviews = useMemo(
    () => (images ? Array.from(images).map((f) => URL.createObjectURL(f)) : []),
    [images]
  );

  useEffect(() => {
    return () => {
      imgPreviews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [imgPreviews]);

  /* ================= HELPERS ================= */

  function extOf(name: string) {
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  function generateVerificationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    return `GLOBUI-${code}`;
  }

  async function generateIdeaHash(title: string, tagline: string, impact: string) {
    const encoder = new TextEncoder();

    const data = encoder.encode(
      JSON.stringify({
        title,
        tagline,
        impact,
      })
    );

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /* ================= FILE UPLOAD ================= */

  async function uploadFile(file: File, kind: AssetKind, ideaId: string) {
    const ext = extOf(file.name) || kind;
    const path = `ideas/${ideaId}/${kind}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('Idea-assets')
      .upload(path, file);

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage
      .from('Idea-assets')
      .getPublicUrl(path);

    const url = data?.publicUrl;

    if (!url) throw new Error('Could not generate public URL');

    const { error: dbErr } = await supabase
      .from('idea_assets')
      .insert({
        idea_id: ideaId,
        kind,
        url,
      });

    if (dbErr) throw new Error(dbErr.message);
  }

  /* ================= SUBMIT ================= */

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);

    if (!attested) {
      setError('You must confirm the attestation before submitting your idea.');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      /* ================= 🔥 FIX: GET INVENTOR NAME ================= */

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      const inventorName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        'Unknown';

      /* ================= GENERATE VALUES ================= */

      const verificationCode = generateVerificationCode();

      const ideaHash = await generateIdeaHash(
        title.trim(),
        tagline.trim(),
        impact.trim()
      );

      /* ================= CREATE IDEA ================= */

      const { data: idea, error: insErr } = await supabase
        .from('ideas')
        .insert([
          {
            user_id: user.id,
            full_name: inventorName, // ✅ FIX APPLIED

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

            attested: true,
            attested_at: new Date().toISOString(),

            verification_code: verificationCode,
            idea_hash: ideaHash,

            evidence_version: 1,
          },
        ])
        .select('id')
        .single();

      if (insErr) throw new Error(insErr.message);

      const ideaId = idea.id;

      /* ================= AUDIT LOG ================= */

      await supabase.from('idea_audit_log').insert({
        idea_id: ideaId,
        user_id: user.id,
        event_type: 'idea_submitted',
        event_data: {
          title: title.trim(),
          category,
          hash: ideaHash,
        },
      });

      /* ================= UPLOAD FILES ================= */

      const uploads: Promise<void>[] = [];

      if (images) {
        for (const file of Array.from(images)) {
          uploads.push(uploadFile(file, 'image', ideaId));
        }
      }

      if (video) uploads.push(uploadFile(video, 'video', ideaId));
      if (pdf) uploads.push(uploadFile(pdf, 'pdf', ideaId));

      if (uploads.length) {
        await Promise.all(uploads);
      }

      /* ================= STRIPE ================= */

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

  /* ================= UI ================= */

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
  };

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
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            style={inputStyle}
            placeholder="Tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />

          <textarea
            style={{ ...inputStyle, minHeight: 100 }}
            placeholder="Impact / Problem Solved"
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
          />

          <select
            style={inputStyle}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Smart Security & Tech</option>
            <option>Eco & Sustainability</option>
            <option>Mobility & Safety</option>
            <option>Home & Lifestyle</option>
            <option>General</option>
          </select>

          <label style={{ display: 'flex', gap: 8 }}>
            <input
              type="checkbox"
              checked={attested}
              onChange={(e) => setAttested(e.target.checked)}
            />
            <span style={{ fontSize: 13 }}>
              I attest that this idea is my original work.
            </span>
          </label>

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
            }}
          >
            {loading
              ? 'Processing…'
              : `Submit & Pay $${(totalPriceCents / 100).toFixed(2)}`}
          </button>

        </form>
      </div>
    </main>
  );
}