'use client';

import { useState, useMemo, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase'; // 👈 IMPORTANT: path from /app/submit/page.tsx

// Make sure you actually have a storage bucket named "idea_assets"
type AssetKind = 'image' | 'video' | 'pdf';

export default function SubmitPage() {
  const router = useRouter();

  // form fields
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [impact, setImpact] = useState('');
  const [category, setCategory] = useState('Smart Security & Tech');

  // files
  const [images, setImages] = useState<FileList | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);

  // ui
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // previews (client-only)
  const imgPreviews = useMemo(
    () => (images ? Array.from(images).map((f) => URL.createObjectURL(f)) : []),
    [images]
  );

  // size limits (MB)
  const MAX_IMG_MB = 10;
  const MAX_VIDEO_MB = 120;
  const MAX_PDF_MB = 15;

  function tooBig(f: File, maxMb: number) {
    return f.size > maxMb * 1024 * 1024;
  }

 async function uploadFile(file: File, kind: AssetKind, ideaId: string) {
  const ext = file.name.split('.').pop() || (kind === 'pdf' ? 'pdf' : kind);
  const path = `ideas/${ideaId}/${kind}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  // 1) upload to storage (bucket: idea-assets)
  const { error: upErr, data: upData } = await supabase.storage
    .from('idea-assets') // ✅ bucket name with hyphen
    .upload(path, file, { upsert: false });

  if (upErr) throw upErr;

  const storedPath = upData?.path ?? path;

  // 2) get public URL
  const { data } = supabase.storage.from('idea-assets').getPublicUrl(storedPath);
  const url = data?.publicUrl;
  if (!url) throw new Error('Could not get public URL for upload');

  // 3) save asset row (table: idea_assets)
  const { error: dbErr } = await supabase.from('idea_assets').insert({
    idea_id: ideaId,
    kind,
    url,
  });

  if (dbErr) throw dbErr;
}

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!title.trim()) {
      setError('Please enter a title.');
      return;
    }

    // size checks
    if (images) {
      for (const f of Array.from(images)) {
        if (tooBig(f, MAX_IMG_MB)) {
          setError(`Image "${f.name}" is larger than ${MAX_IMG_MB}MB.`);
          return;
        }
      }
    }
    if (video && tooBig(video, MAX_VIDEO_MB)) {
      setError(`Video is larger than ${MAX_VIDEO_MB}MB.`);
      return;
    }
    if (pdf && tooBig(pdf, MAX_PDF_MB)) {
      setError(`PDF is larger than ${MAX_PDF_MB}MB.`);
      return;
    }

    try {
      setLoading(true);

      // 1) Create draft idea (requires payment)
      const { data: idea, error: insErr } = await supabase
        .from('ideas')
        .insert([
          {
            title: title.trim(),
            tagline: tagline.trim() || null,
            impact: impact.trim() || null,
            category,
            status: 'pending', // admin review status
            protected: true,
            payment_status: 'requires_payment',
            price_cents: 199,
          },
        ])
        .select('id')
        .single();

      if (insErr) throw insErr;
      const ideaId = idea!.id as string;

      // 2) simulate payment success
      const { error: payErr } = await supabase
        .from('ideas')
        .update({
          payment_status: 'paid',
          deposited_at: new Date().toISOString(),
        })
        .eq('id', ideaId);
      if (payErr) throw payErr;

      // 3) Upload assets
      const jobs: Promise<any>[] = [];
      if (images && images.length) {
        for (const f of Array.from(images)) jobs.push(uploadFile(f, 'image', ideaId));
      }
      if (video) jobs.push(uploadFile(video, 'video', ideaId));
      if (pdf) jobs.push(uploadFile(pdf, 'pdf', ideaId));
      if (jobs.length) await Promise.all(jobs);

      // 4) Send email notification to admin (non-blocking)
      try {
        const adminEmail =
          process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'anewdawn1st@gmail.com';

        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: adminEmail,
            subject: `New idea submitted: ${title.trim() || 'Untitled idea'}`,
            html: `
              <h2>New Idea Submitted</h2>
              <p><strong>Title:</strong> ${title}</p>
              ${tagline ? `<p><strong>Tagline:</strong> ${tagline}</p>` : ''}
              ${impact ? `<p><strong>Impact:</strong> ${impact}</p>` : ''}
              <p><strong>Category:</strong> ${category}</p>
              <p><strong>Idea ID:</strong> ${ideaId}</p>
            `,
          }),
        });
      } catch (emailErr) {
        console.error('Resend email error:', emailErr);
        // Don't block the user because of email issues
      }

      // 5) success UI
      setOk('✅ Submitted & paid! Your idea is timestamped. We’ll review shortly.');
      setTitle('');
      setTagline('');
      setImpact('');
      setImages(null);
      setVideo(null);
      setPdf(null);

      // small delay then go home (or wherever you like)
      setTimeout(() => router.push('/'), 1200);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // small inline styles reused (unchanged layout)
  const inputS: CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    outline: 'none',
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-4 py-10">
      <div
        style={{
          maxWidth: 780,
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            fontSize: 34,
            fontWeight: 800,
            textAlign: 'center',
            background: 'linear-gradient(90deg, #00f2fe, #03e1ff, #00c9ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 12,
          }}
        >
          Submit Your Unique Idea 💡
        </h1>

        <p
          style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.85)',
            fontSize: 15,
            lineHeight: 1.7,
            maxWidth: 700,
            margin: '0 auto 30px',
          }}
        >
          Welcome to the <strong>Bank of Unique Ideas</strong> — a global creative vault where
          every idea counts. Uploading images or videos is optional but highly encouraged to
          help us visualize your concept clearly.
        </p>

        <form
          onSubmit={onSubmit}
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
            padding: 24,
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'grid',
            gap: 18,
            color: '#fff',
          }}
        >
          {/* Title */}
          <div>
            <label htmlFor="title" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
              Idea Title <span style={{ color: '#00f2fe' }}>*</span>
            </label>
            <input
              id="title"
              style={inputS}
              placeholder="Example: Viewviq Smart Mirror"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Tagline */}
          <div>
            <label htmlFor="tagline" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
              One-line Tagline (blurred)
            </label>
            <input
              id="tagline"
              style={inputS}
              placeholder="e.g., AI-assisted mirror that keeps roads safer"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>

          {/* Impact */}
          <div>
            <label htmlFor="impact" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
              Impact / Problem Solved (blurred)
            </label>
            <textarea
              id="impact"
              style={{ ...inputS, minHeight: 120, resize: 'vertical' }}
              placeholder="Who benefits? What pain does this solve? What value/impact?"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}
            >
              Category
            </label>
            <select
              id="category"
              style={inputS}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Smart Security & Tech</option>
              <option>Eco & Sustainability</option>
              <option>Home & Lifestyle</option>
              <option>Mobility & Safety</option>
              <option>General</option>
            </select>
          </div>

          {/* Attachments */}
          <div style={{ marginTop: 6 }}>
            <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#00f2fe' }}>
              Attachments (Optional)
            </h2>

            {/* Images */}
            <div style={{ marginBottom: 12 }}>
              <label
                htmlFor="images"
                style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}
              >
                Images
              </label>
              <input
                id="images"
                style={inputS}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(e.target.files)}
              />
              {!!imgPreviews.length && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                  {imgPreviews.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt="preview"
                      style={{
                        width: 90,
                        height: 90,
                        objectFit: 'cover',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Video */}
            <div style={{ marginBottom: 12 }}>
              <label
                htmlFor="video"
                style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}
              >
                Video (optional)
              </label>
              <input
                id="video"
                type="file"
                accept="video/*"
                style={inputS}
                onChange={(e) => setVideo(e.target.files?.[0] || null)}
              />
            </div>

            {/* PDF */}
            <div>
              <label htmlFor="pdf" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
                PDF (optional)
              </label>
              <input
                id="pdf"
                type="file"
                accept="application/pdf"
                style={inputS}
                onChange={(e) => setPdf(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {/* messages */}
          {error && <p style={{ color: '#fca5a5', fontSize: 13 }}>{error}</p>}
          {ok && <p style={{ color: '#86efac', fontSize: 13 }}>{ok}</p>}

          {/* submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 12,
              padding: '12px 24px',
              borderRadius: 50,
              border: 'none',
              background: loading
                ? 'linear-gradient(90deg, #777, #555)'
                : 'linear-gradient(90deg, #00f2fe, #03e1ff, #00c9ff)',
              color: '#000',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1,
              boxShadow: '0 0 14px rgba(0,240,255,0.6)',
            }}
          >
            {loading ? 'Processing…' : 'Submit & Pay $1.99 (Simulated)'}
          </button>
        </form>
      </div>
    </main>
  );
}