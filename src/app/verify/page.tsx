'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import CertificateCard from '@/CertificateCard';

export default function VerifyPage() {
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

  const certificateRef = useRef<HTMLDivElement>(null);

  const urlCode = searchParams.get('code') || '';

  const [code, setCode] = useState(urlCode);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* ================= VERIFY ================= */

  async function verifyCertificate(targetCode: string) {
    if (!targetCode.trim()) {
      setError('Enter verification code');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('verification_code', targetCode)
      .single();

    if (error || !data) {
      setError('❌ Certificate Not Found');
      setLoading(false);
      return;
    }

    setResult(data);
    setLoading(false);
  }

  /* ================= AUTO LOAD ================= */

  useEffect(() => {
    if (urlCode) {
      verifyCertificate(urlCode);
    }
  }, [urlCode]);

  /* ================= DOWNLOAD ================= */

  async function downloadPDF() {
    if (!certificateRef.current) return;

    const canvas = await html2canvas(certificateRef.current, {
      scale: 2,
      backgroundColor: '#f5efe0',
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('landscape', 'px', 'a4');

    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, width, height);

    pdf.save(`BOUI-${code}.pdf`);
  }

  function printCertificate() {
    window.print();
  }

  function copyLink() {
    const url = `${window.location.origin}/verify?code=${code}`;
    navigator.clipboard.writeText(url);
    alert('Verification link copied!');
  }

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-black text-white px-4 py-10">

      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 34, fontWeight: 900 }}>
          Bank of Unique Ideas
        </h1>

        <p style={{ opacity: 0.6 }}>
          Certificate Verification Portal
        </p>
      </div>

      {/* INPUT (ONLY IF NO RESULT YET) */}
      {!result && (
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter Code"
            style={{
              padding: 14,
              width: '100%',
              maxWidth: 420,
              borderRadius: 12,
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#fff',
              textAlign: 'center',
            }}
          />

          <br /><br />

          <button
            onClick={() => verifyCertificate(code)}
            className="bg-white text-black px-5 py-2 rounded-lg font-semibold"
          >
            {loading ? 'Verifying...' : 'Verify Certificate'}
          </button>

          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}

      {/* CERTIFICATE */}
      {result && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p style={{ opacity: 0.6 }}>
              Scroll down for full view, download or print
            </p>
          </div>

          <div ref={certificateRef}>
            <CertificateCard data={result} mode="export" />
          </div>

          {/* ACTIONS */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={downloadPDF}
              className="bg-white text-black px-4 py-2 rounded-lg font-semibold mr-2"
            >
              Download PDF
            </button>

            <button
              onClick={printCertificate}
              className="bg-white text-black px-4 py-2 rounded-lg font-semibold mr-2"
            >
              Print
            </button>

            <button
              onClick={copyLink}
              className="bg-white text-black px-4 py-2 rounded-lg font-semibold"
            >
              Copy Link
            </button>
          </div>
        </>
      )}

    </main>
  );
}