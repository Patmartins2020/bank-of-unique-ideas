'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function NdaUploadPage() {
  const sp = useSearchParams();
  const requestId = sp.get('requestId');
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!requestId) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        <h1 className="text-2xl font-bold">Missing requestId</h1>
        <p className="text-white/70 mt-2">
          Please use the upload link from your email.
        </p>
      </main>
    );
  }

  async function submit() {
    if (!file) return setMsg('Please select the signed NDA PDF first.');
    setLoading(true);
    setMsg(null);

    const form = new FormData();
    form.append('requestId', requestId!);
    form.append('file', file);

    const res = await fetch('/api/nda/upload', { method: 'POST', body: form });
    const json = await res.json().catch(() => ({}));

    setLoading(false);
    setMsg(res.ok ? 'Uploaded. We’ll review and email you access.' : (json?.error ?? 'Upload failed.'));
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold">Upload Signed NDA</h1>
        <p className="text-white/70 mt-2">Request ID: {requestId}</p>

        <div className="mt-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-black disabled:opacity-60"
        >
          {loading ? 'Uploading…' : 'Submit'}
        </button>

        {msg && <p className="mt-3 text-sm text-white/80">{msg}</p>}
      </div>
    </main>
  );
}