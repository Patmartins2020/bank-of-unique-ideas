import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase'; // adjust path if needed

type NdaRow = {
  id: string;
  status: string;
  investor_email: string | null;
  investor_name: string | null;
  signed_nda_path: string | null;
  signed_uploaded_at: string | null;
};

export default function NdaPage() {
  const router = useRouter();
  const ndaId = router.query.id as string | undefined;

  const [row, setRow] = useState<NdaRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const templateUrl = useMemo(() => {
    // The file you uploaded to nda_files:
    const { data } = supabase.storage
      .from('nda_files')
      .getPublicUrl('NDA-template.pdf');
    return data.publicUrl;
  }, []);

  useEffect(() => {
    if (!ndaId) return;

    (async () => {
      setErr(null);
      const { data, error } = await supabase
        .from('nda_requests')
        .select(
          'id,status,investor_email,investor_name,signed_nda_path,signed_uploaded_at'
        )
        .eq('id', ndaId)
        .maybeSingle();

      if (error) {
        setErr(error.message);
        return;
      }
      if (!data) {
        setErr('NDA request not found.');
        return;
      }

      setRow(data as NdaRow);
      setName((data as any).investor_name ?? '');
      setEmail((data as any).investor_email ?? '');
    })();
  }, [ndaId]);

  async function uploadSignedNda() {
    if (!ndaId) return;
    setErr(null);
    setMsg(null);

    if (!file) {
      setErr('Please choose the signed NDA PDF to upload.');
      return;
    }

    // Basic checks
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErr('Please upload a PDF file.');
      return;
    }

    setLoading(true);
    try {
      // 1) Upload to private bucket signed-ndas
      const safeName = file.name.replace(/\s+/g, '_');
      const path = `${ndaId}/${Date.now()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from('signed-ndas')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/pdf',
        });

      if (upErr) throw upErr;

      // 2) Update nda_requests row
      const updates = {
        status: 'uploaded',
        signed_nda_path: path,
        signed_uploaded_at: new Date().toISOString(),
        investor_name: name || null,
        investor_email: email || null,
      };

      const { error: dbErr } = await supabase
        .from('nda_requests')
        .update(updates)
        .eq('id', ndaId);

      if (dbErr) throw dbErr;

      setMsg(
        'Upload successful. Your signed NDA has been submitted for review.'
      );
      // refresh row
      setRow((prev) =>
        prev
          ? { ...prev, ...updates }
          : ({
              id: ndaId,
              status: 'uploaded',
              signed_nda_path: path,
              signed_uploaded_at: updates.signed_uploaded_at,
              investor_email: updates.investor_email,
              investor_name: updates.investor_name,
            } as NdaRow)
      );
    } catch (e: any) {
      setErr(e?.message || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '40px auto',
        padding: 16,
        fontFamily: 'system-ui',
      }}
    >
      <h1>NDA Form</h1>

      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      {msg && <p style={{ color: 'green' }}>{msg}</p>}

      {!row ? (
        <p>Loading…</p>
      ) : (
        <>
          <p>
            Please download the NDA template, sign it, then upload the signed
            copy below.
          </p>

          <div style={{ margin: '16px 0' }}>
            <a
              href={templateUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block',
                padding: '10px 14px',
                border: '1px solid #999',
                borderRadius: 8,
              }}
            >
              Download NDA Template
            </a>
          </div>

          <hr style={{ margin: '24px 0' }} />

          {row.status === 'uploaded' && row.signed_nda_path ? (
            <div>
              <h3>Signed NDA Received</h3>
              <p>
                We have received your signed NDA. Please wait for admin review
                and approval.
              </p>
            </div>
          ) : (
            <div>
              <h3>Upload Signed NDA (PDF)</h3>

              <label style={{ display: 'block', marginBottom: 8 }}>
                Your Name (optional):
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 10,
                    marginTop: 6,
                  }}
                />
              </label>

              <label style={{ display: 'block', marginBottom: 8 }}>
                Your Email (optional):
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 10,
                    marginTop: 6,
                  }}
                />
              </label>

              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{ display: 'block', margin: '12px 0' }}
              />

              <button
                onClick={uploadSignedNda}
                disabled={loading}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: 'none',
                }}
              >
                {loading ? 'Uploading…' : 'Upload Signed NDA'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
