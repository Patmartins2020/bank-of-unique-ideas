'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type NdaRequestRow = {
  id: string;
  idea_id: string;
  user_id: string;
  email: string | null;
  status: string | null;
  signed_file_path: string | null;
  nda_signed_at: string | null;
  nda_form_sent_at: string | null;
};

export default function InvestorNdaUploadPage() {
  const supabase = createClientComponentClient();
  const params = useParams();
  const router = useRouter();

  const requestId = useMemo(() => String(params?.requestId || ''), [params]);

  const [row, setRow] = useState<NdaRequestRow | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setErr(null);

      // Must be signed in
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('nda_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();

      if (error) {
        setErr(error.message);
        return;
      }
      if (!data) {
        setErr('NDA request not found.');
        return;
      }

      setRow(data as NdaRequestRow);
    }

    if (requestId) load();
  }, [requestId, supabase, router]);

  async function uploadSignedNda() {
    if (!row) return;
    if (!file) {
      setErr('Please choose your signed NDA file first.');
      return;
    }

    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      // Build a safe storage path (group by requestId)
      const ext = file.name.split('.').pop() || 'pdf';
      const filePath = `nda/${row.id}/signed_${Date.now()}.${ext}`;

      // 1) Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('signed-ndas')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2) Update nda_requests row with signed file path + timestamp
      const updates = {
        signed_file_path: filePath,
        nda_signed_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('nda_requests')
        .update(updates)
        .eq('id', row.id);

      if (updateError) throw updateError;

      setRow((prev) => (prev ? { ...prev, ...updates } : prev));
      setMsg('Uploaded successfully. Admin will review and approve shortly.');
    } catch (e: any) {
      setErr(e?.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">NDA Request</h1>
        <p className="text-white/70 mb-6">
          Download the NDA template, sign it, then upload the signed copy here.
        </p>

        {err && <p className="text-red-400 mb-4">{err}</p>}
        {msg && <p className="text-emerald-300 mb-4">{msg}</p>}

        {!row ? (
          <p className="text-white/60">Loading…</p>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
            <div className="text-sm text-white/70">
              <div>
                <span className="text-white/50">Request ID:</span> {row.id}
              </div>
              <div>
                <span className="text-white/50">Idea ID:</span> {row.idea_id}
              </div>
              <div>
                <span className="text-white/50">Status:</span>{' '}
                {row.status ?? 'requested'}
              </div>
              <div>
                <span className="text-white/50">Signed NDA:</span>{' '}
                {row.signed_file_path ? 'Uploaded' : 'Not uploaded yet'}
              </div>
            </div>

            {/* Download template */}
            <a
              href="/nda/NDA_Template.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500"
            >
              Download NDA Template (PDF)
            </a>

            {/* Upload signed file */}
            <div className="space-y-2">
              <label className="block text-sm text-white/70">
                Upload Signed NDA
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm"
              />

              <button
                onClick={uploadSignedNda}
                disabled={busy}
                className="text-sm px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
              >
                {busy ? 'Uploading…' : 'Submit Signed NDA'}
              </button>
            </div>

            <p className="text-xs text-white/50">
              After upload, the admin will review your signed NDA and approve
              access to the idea.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
