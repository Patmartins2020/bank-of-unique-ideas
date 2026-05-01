'use client';

import QRCode from 'qrcode';

type Props = {
  data: {
    full_name?: string | null;
    title?: string | null;
    category?: string | null;
    verification_code?: string | null;
    created_at?: string | null;
    avatar_url?: string | null;
  };
  mode?: 'responsive' | 'export';
};

export default function CertificateCard({ data, mode = 'responsive' }: Props) {
  const isExport = mode === 'export';

  const createdDate = data.created_at
    ? new Date(data.created_at).toLocaleString()
    : 'Unknown date';

  const verifyURL =
    typeof window !== 'undefined'
      ? `${window.location.origin}/verify?code=${data.verification_code}`
      : '';

  return (
    <div
      style={{
        width: isExport ? 1120 : '100%',
        minHeight: isExport ? 794 : 640,
        margin: '0 auto',
        padding: isExport ? 60 : 30,
        background: '#f5efe0',
        border: '4px solid #b89b2e',
        fontFamily: 'Georgia, serif',
        color: '#000',
        position: 'relative',
      }}
    >
      {/* WATERMARK */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 140,
          fontWeight: 900,
          opacity: 0.015,
          transform: 'rotate(-20deg)',
        }}
      >
        BOUI VERIFIED
      </div>

      {/* HEADER */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 36, fontWeight: 900 }}>
          CERTIFICATE OF AUTHENTICITY
        </h1>
        <p style={{ color: '#333' }}>
          Issued by Bank of Unique Ideas Registry
        </p>
      </div>

      {/* PHOTO */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 60,
          width: 110,
          height: 130,
          border: '2px solid #b89b2e',
          background: '#fff',
        }}
      >
        {data.avatar_url && (
          <img
            src={data.avatar_url}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

      {/* BODY */}
      <div style={{ textAlign: 'center', marginTop: 80 }}>
        <p>Presented to</p>

        <h2 style={{ fontSize: 52, fontWeight: 900 }}>
          {data.full_name || 'Unnamed Inventor'}
        </h2>

        <p>For the registered innovation</p>

        <h3 style={{ fontSize: 40, color: '#7a5d0c' }}>
          {data.title || 'Untitled Idea'}
        </h3>
      </div>

      {/* DETAILS */}
      <div style={{ marginTop: 60, marginLeft: 80, fontSize: 18 }}>
        <p><strong>Category:</strong> {data.category}</p>
        <p><strong>Status:</strong> Protected & Recorded</p>
        <p><strong>Certificate ID:</strong> {data.verification_code}</p>
        <p><strong>Registered on:</strong> {createdDate}</p>
      </div>

      {/* QR CODE */}
      <div style={{ position: 'absolute', bottom: 80, left: 80 }}>
        {verifyURL && (
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${verifyURL}`}
            width={100}
          />
        )}
        <p style={{ fontSize: 10 }}>Scan to verify</p>
      </div>

      {/* RIBBON SEAL */}
      <div style={{ position: 'absolute', bottom: 60, right: 80 }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, #f5d97a, #c9a227 70%, #7a5d0c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 12,
          }}
        >
          BOUI<br />OFFICIAL<br />SEAL
        </div>

        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: '25px solid transparent',
            borderRight: '25px solid transparent',
            borderTop: '60px solid #1e3a8a',
            margin: '0 auto',
            marginTop: -10,
          }}
        />
      </div>

      {/* SIGNATURE */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          right: 60,
          textAlign: 'center',
        }}
      >
        <p>Digital Signature</p>
        <img src="/founder-signature.png" width={140} />
        <div style={{ borderTop: '1px solid #000' }}>
          Akata Patrick Ignatius
        </div>
      </div>
    </div>
  );
}