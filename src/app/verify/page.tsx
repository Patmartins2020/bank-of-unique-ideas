'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import CertificateCard from '@/CertificateCard';

function VerifyContent() {
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

  const certificateRef = useRef<HTMLDivElement>(null);

  const initialCode = searchParams.get('code') || '';

  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    setError('');
    setResult(null);

    if (!code.trim()) {
      setError('Enter verification code');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('verification_code', code.trim())
      .single();

    if (error || !data) {
      setError('❌ Certificate Not Found');
      setLoading(false);
      return;
    }

    setResult(data);
    setLoading(false);
  }

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

  return (
    <main className="min-h-screen bg-black text-white px-4 py-10">

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 34, fontWeight: 900 }}>
          Bank of Unique Ideas
        </h1>
        <p style={{ opacity: 0.6 }}>
          Certificate Verification Portal
        </p>
      </div>

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

        <button onClick={handleVerify} className="relative z-50 inline-flex items-center gap-2 text-sm px-5 py-2 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition">
          {loading ? 'Verifying...' : 'Verify Certificate'}
        </button>

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>

      {result && (
        <>
          <div ref={certificateRef}>
            <CertificateCard data={result} mode="export" />
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button onClick={downloadPDF} className="relative z-50 inline-flex items-center gap-2 text-sm px-5 py-2 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition">
              Download PDF
            </button>
            <button onClick={printCertificate} className="relative z-50 inline-flex items-center gap-2 text-sm px-5 py-2 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition">
              Print
            </button>
            <button onClick={copyLink} className="relative z-50 inline-flex items-center gap-2 text-sm px-5 py-2 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition">
              Copy Link
            </button>
          </div>
        </>
      )}

    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ padding: 50 }}>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}