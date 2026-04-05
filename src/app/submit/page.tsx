'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SubmitPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [impact, setImpact] = useState('');
  const [category, setCategory] = useState('Smart Security & Tech');
  const [clue, setClue] = useState('');
  const [attested, setAttested] = useState(false);

  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

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
    const data = encoder.encode(JSON.stringify({ title, tagline, impact }));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 400,
          height: 400,
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraOn(true);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to access camera.');
    }
  }

  function captureSelfie() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 400;
    ctx.drawImage(video, 0, 0, 400, 400);

    const image = canvas.toDataURL('image/png');
    setPreview(image);

    const stream = video.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());

    setCameraOn(false);
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function saveProfilePhoto(userId: string) {
    if (!preview) return null;

    const blob = await fetch(preview).then((r) => r.blob());
    const filePath = `${userId}/passport-photo.png`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        upsert: true,
        contentType: 'image/png',
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

    const avatarUrl = data.publicUrl;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (profileError) throw profileError;

    return avatarUrl;
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
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      await saveProfilePhoto(user.id);

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profileErr) {
        throw new Error(profileErr.message);
      }

      const inventorName =
        profile?.full_name || user.user_metadata?.full_name || 'Unknown';

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
        console.error('IDEA INSERT ERROR:', insErr);
        throw new Error(insErr?.message || 'Idea save failed.');
      }

      const checkoutRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ideaId: idea.id }),
      });

      const rawText = await checkoutRes.text();
      console.log('CHECKOUT RESPONSE:', rawText);

      if (!checkoutRes.ok) {
        throw new Error(`Checkout failed: ${rawText}`);
      }

      let checkoutData: { ok?: boolean; url?: string; error?: string };

      try {
        checkoutData = JSON.parse(rawText);
      } catch {
        throw new Error(
          `Checkout returned invalid JSON: ${rawText.slice(0, 120)}`
        );
      }

      if (!checkoutData.ok || !checkoutData.url) {
        throw new Error(checkoutData.error || 'Payment route failed.');
      }

     if (checkoutData?.url) {
  window.location.assign(checkoutData.url);
  return;
}

throw new Error('Stripe checkout URL missing.');
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

  const smallButtonStyle: CSSProperties = {
    padding: '10px 16px',
    borderRadius: 999,
    border: 'none',
    background: '#1e293b',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
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
          <div>
            <p style={{ fontWeight: 700, marginBottom: 10 }}>
              Inventor Passport Photo
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={startCamera} style={smallButtonStyle}>
                📸 Take Selfie
              </button>

              <label
                style={{
                  ...smallButtonStyle,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                🖼 Upload
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleUpload}
                />
              </label>
            </div>

            {cameraOn && (
              <div style={{ marginTop: 10 }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: 240,
                    height: 240,
                    borderRadius: 12,
                    objectFit: 'cover',
                    background: '#000',
                    marginTop: 10,
                  }}
                />
                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={captureSelfie}
                    style={smallButtonStyle}
                  >
                    Capture
                  </button>
                </div>
              </div>
            )}

            {preview && (
              <img
                src={preview}
                alt="passport"
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 12,
                  objectFit: 'cover',
                  marginTop: 10,
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              />
            )}

            <canvas ref={canvasRef} hidden />
          </div>

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

          <input
            style={inputStyle}
            placeholder="Protected Clue"
            value={clue}
            onChange={(e) => setClue(e.target.value)}
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

          <label>
            <input
              type="checkbox"
              checked={attested}
              onChange={(e) => setAttested(e.target.checked)}
            />{' '}
            I attest this idea is mine.
          </label>

          {error && <p style={{ color: '#f87171' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px 22px',
              borderRadius: 50,
              border: 'none',
              background: loading ? '#334155' : '#00f2fe',
              color: '#000',
              fontWeight: 800,
              fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 18px rgba(0,242,254,0.35)',
            }}
          >
            {loading ? 'Processing…' : 'Submit Idea'}
          </button>
        </form>
      </div>
    </main>
  );
}