'use client';

import { useEffect, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ProfilePhotoPage() {
  const supabase = createClientComponentClient();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) setUserId(user.id);
    }

    init();
  }, [supabase]);

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      setCameraOn(true);
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

    const stream = video.srcObject as MediaStream;
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

  async function savePhoto() {
    if (!preview || !userId) return;

    try {
      setSaving(true);

      const blob = await fetch(preview).then((r) => r.blob());
      const filePath = `${userId}/passport-photo.png`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          upsert: true,
          contentType: 'image/png',
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = data.publicUrl;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);

      if (profileError) throw profileError;

      alert('Passport photo saved successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to save photo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-20">
      <div className="max-w-2xl mx-auto rounded-3xl border border-white/10 bg-black/40 p-8 space-y-6">
        <h1 className="text-3xl font-bold text-emerald-300">
          Upload Passport Photo
        </h1>

        <p className="text-white/60">
          This image will appear on your BOUI certificate.
        </p>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={startCamera}
            className="rounded-full bg-cyan-400 px-5 py-2 text-black font-semibold"
          >
            📸 Take Selfie
          </button>

          <label className="rounded-full bg-emerald-400 px-5 py-2 text-black font-semibold cursor-pointer">
            🖼 Upload Photo
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleUpload}
            />
          </label>
        </div>

        {cameraOn && (
          <div className="space-y-4">
            <video
              ref={videoRef}
              autoPlay
              className="w-64 h-64 rounded-2xl object-cover border border-white/10"
            />

            <button
              onClick={captureSelfie}
              className="rounded-full bg-amber-400 px-5 py-2 text-black font-semibold"
            >
              Capture Selfie
            </button>
          </div>
        )}

        {preview && (
          <div className="space-y-4">
            <img
              src={preview}
              alt="preview"
              className="w-48 h-48 rounded-2xl object-cover border border-white/10"
            />

            <button
              onClick={savePhoto}
              disabled={saving}
              className="rounded-full bg-emerald-500 px-6 py-2 text-black font-semibold"
            >
              {saving ? 'Saving...' : 'Save Passport Photo'}
            </button>
          </div>
        )}

        <canvas ref={canvasRef} hidden />
      </div>
    </main>
  );
}