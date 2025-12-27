'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function NdaForm({ requestId }: { requestId: string }) {
  const supabase = createClientComponentClient();

  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function uploadSignedNDA(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!file) {
      setErr('Please upload the signed NDA file.');
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Get currently logged-in investor
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErr('Please log in before uploading the NDA.');
        return;
      }

      // 2️⃣ Upload file to Supabase Storage
      const filename = `${requestId}-${Date.now()}-${file.name}`;
      const path = `signed-ndas/${filename}`;

      const { error: uploadErr } = await supabase.storage
        .from('nda_files')
        .upload(path, file);

      if (uploadErr) throw uploadErr;

      // 3️⃣ Save file path + update status
      const { error: updateErr } = await supabase
        .from('nda_requests')
        .update({
          status: 'signed',
          signed_file_path: path,
        })
        .eq('id', requestId);

      if (updateErr) throw updateErr;

      setMsg('Signed NDA uploaded successfully. The admin will review it.');
      setFile(null);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Could not upload NDA.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen text-white px-6 py-10">
      <h1 className="text-2xl font-bold">NDA Request #{requestId}</h1>

      <p className="mt-2 text-sm text-white/70">
        Download the NDA, sign it, then upload the signed copy below.
      </p>

      <a
        href="/legal/nda.pdf"
        target="_blank"
        className="mt-4 inline-block rounded-lg bg-emerald-400 px-4 py-2 text-black font-semibold"
      >
        Download NDA
      </a>

      <form onSubmit={uploadSignedNDA} className="mt-6 space-y-3">
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-white/80"
        />

        {err && <p className="text-red-300 text-sm">{err}</p>}
        {msg && <p className="text-emerald-300 text-sm">{msg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white px-4 py-2 text-black font-semibold disabled:opacity-60"
        >
          {loading ? 'Uploading…' : 'Upload Signed NDA'}
        </button>
      </form>
    </main>
  );
}