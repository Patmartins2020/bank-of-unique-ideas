'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import CertificateCard from '@/CertificateCard';

export default function VerifyPage() {
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

  const certificateRef = useRef<HTMLDivElement>(null);

  const codeFromUrl = searchParams.get('code');

  const [code, setCode] = useState(codeFromUrl || '');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* ================= AUTO LOAD ================= */

  useEffect(() => {
    if (codeFromUrl) {
      handleVerify(codeFromUrl);
    }
  }, [codeFromUrl]);

  /* ================= VERIFY ================= */

  async function handleVerify(customCode?: string) {
    const finalCode = customCode || code;

    setError('');
    setResult(null);

    if (!finalCode.trim()) {
      setError('Enter verification code');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('verification_code', finalCode.trim())
      .single();

    if (error || !data) {
      setError('❌ Certificate Not Found');
      setLoading(false);
      return;
    }

    setResult(data);
    setLoading(false);
  }

  /* ================= DOWNLOAD ================= */

  async function downloadPDF() {
    if (!certificateRef.current) return;

    const canvas = await html2canvas(certificateRef.current, {
      scale: 2,
      backgroundColor: null
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('landscape', 'px', 'a4');

    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, width, height);

    pdf.save(`BUI-${result.verification_code}.pdf`);
  }

  function printCertificate() {
    window.print();
  }

  function copyLink() {
    const url = `${window.location.origin}/verify?code=${result.verification_code}`;
    navigator.clipboard.writeText(url);
    alert('Verification link copied!');
  }

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black text-white px-4 py-10">

      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 34, fontWeight: 900 }}>
          Bank of Unique Ideas
        </h1>
        <p style={{ opacity: 0.6 }}>
          Official Certificate Verification Portal
        </p>
      </div>

      {/* INPUT */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <input
          placeholder="Enter Code (GLOBUI-XXXXXX)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{
            padding: 14,
            width: '100%',
            maxWidth: 420,
            borderRadius: 12,
            background: '#0f172a',
            border: '1px solid #334155',
            color: '#fff',
            textAlign: 'center',
            fontWeight: 'bold'
          }}
        />

        <br /><br />

        <button
          onClick={() => handleVerify()}
          style={{
            padding: '12px 20px',
            borderRadius: 30,
            background: '#00f2fe',
            color: '#000',
            fontWeight: 700
          }}
        >
          {loading ? 'Verifying...' : 'Verify Certificate'}
        </button>

        {error && (
          <p style={{ color: '#f87171', marginTop: 10 }}>{error}</p>
        )}
      </div>

      {/* CERTIFICATE */}
      {result && (
        <>
          <div ref={certificateRef}>
            <CertificateCard data={result} />
          </div>

          {/* ACTIONS */}
          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <button onClick={downloadPDF} style={{ marginRight: 10 }}>
              📄 Download PDF
            </button>

            <button onClick={printCertificate} style={{ marginRight: 10 }}>
              🖨️ Print
            </button>

            <button onClick={copyLink}>
              🔗 Copy Link
            </button>
          </div>
        </>
      )}

    </main>
  );
}