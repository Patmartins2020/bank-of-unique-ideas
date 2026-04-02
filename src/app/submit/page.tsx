'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SubmitPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [impact, setImpact] = useState('');
  const [category, setCategory] = useState('Smart Security & Tech');
  const [clue, setClue] = useState('');
  const [attested, setAttested] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generateVerificationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    return `GLOBUI-${code}`;
  }

  async function generateIdeaHash(
    title: string,
    tagline: string,
    impact: string
  ) {
    const encoder = new TextEncoder();

    const data = encoder.encode(
      JSON.stringify({ title, tagline, impact })
    );

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);

    if (!attested) {
      setError('You must confirm attestation.');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        setError('You must be logged in.');
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      const inventorName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        'Unknown';

      const verificationCode = generateVerificationCode();

      const ideaHash = await generateIdeaHash(
        title.trim(),
        tagline.trim(),
        impact.trim()
      );

      const { data: idea, error: insErr } = await supabase
        .from('ideas')
        .insert({
          user_id: user.id,
          full_name: inventorName,
          title: title.trim(),
          tagline: tagline.trim() || null,
          impact: impact.trim() || null,
          category,
          clue: clue.trim() || null,
          status: 'pending',
          protected: true,
          attested: true,
          attested_at: new Date().toISOString(),
          verification_code: verificationCode,
          idea_hash: ideaHash,
        })
        .select('id, verification_code')
        .single();

      if (insErr || !idea) {
        console.error(insErr);
        throw new Error('Failed to save idea.');
      }

      // ✅ BEST NEW FLOW
      router.push(
        `/my-ideas?submitted=1&code=${encodeURIComponent(
          idea.verification_code
        )}`
      );
    } catch (err: any) {
      console.error(err);
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

          <div>
            <input
              style={inputStyle}
              placeholder="Protected Clue (Optional)"
              value={clue}
              onChange={(e) => setClue(e.target.value)}
            />

            <p style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              Write a short, safe hint that attracts attention without
              revealing your idea.
            </p>
          </div>

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
              I attest this idea is mine.
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
            {loading ? 'Processing…' : 'Submit Idea'}
          </button>
        </form>
      </div>
    </main>
  );
}