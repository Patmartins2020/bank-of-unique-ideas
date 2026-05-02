'use client';

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
    <div style={{ overflowX: 'auto' }}>
      <div
        style={{
          width: 1120,
          minHeight: 794,
          margin: '0 auto',
          padding: 60,
          background: '#f5efe0',
          border: '4px solid #b89b2e',
          fontFamily: 'Georgia, serif',
          color: '#111',
          position: 'relative',
          boxSizing: 'border-box',
          transform: isExport ? 'none' : 'scale(0.75)',
          transformOrigin: 'top center',
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
            fontSize: 130,
            fontWeight: 900,
            opacity: 0.012,
            letterSpacing: 8,
            transform: 'rotate(-18deg)',
          }}
        >
          BOUI VERIFIED
        </div>

        {/* CORNER ORNAMENTS */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
          <div
            key={pos}
            style={{
              position: 'absolute',
              width: 60,
              height: 60,
              borderColor: '#b89b2e',
              borderStyle: 'solid',
              ...(pos === 'top-left' && {
                top: 20,
                left: 20,
                borderWidth: '4px 0 0 4px',
              }),
              ...(pos === 'top-right' && {
                top: 20,
                right: 20,
                borderWidth: '4px 4px 0 0',
              }),
              ...(pos === 'bottom-left' && {
                bottom: 20,
                left: 20,
                borderWidth: '0 0 4px 4px',
              }),
              ...(pos === 'bottom-right' && {
                bottom: 20,
                right: 20,
                borderWidth: '0 4px 4px 0',
              }),
            }}
          />
        ))}

        {/* HEADER */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 36, fontWeight: 900 }}>
            CERTIFICATE OF AUTHENTICITY
          </h1>
          <p style={{ color: '#222' }}>
            Issued by Bank of Unique Ideas Registry
          </p>
        </div>

        {/* PHOTO */}
        <div
          style={{
            position: 'absolute',
            top: 90,
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
        <div style={{ textAlign: 'center', marginTop: 90 }}>
          <p style={{ fontSize: 20 }}>Presented to</p>

          <h2 style={{ fontSize: 52, fontWeight: 900 }}>
            {data.full_name || 'Unnamed Inventor'}
          </h2>

          <p style={{ fontSize: 18 }}>For the registered innovation</p>

          <h3 style={{ fontSize: 40, color: '#5c3d00', fontWeight: 900 }}>
            {data.title || 'Untitled Idea'}
          </h3>
        </div>

        {/* DETAILS */}
        <div
          style={{
            marginTop: 60,
            marginLeft: 80,
            fontSize: 18,
            color: '#111',
            lineHeight: 1.8,
          }}
        >
          <p><strong>Category:</strong> {data.category || 'General'}</p>
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
          <p style={{ fontSize: 11 }}>Scan to verify</p>
        </div>

        {/* GOVERNMENT RIBBON SEAL */}
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            right: 100,
            zIndex: 2,
          }}
        >
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
              color: '#3b2f1c',
              border: '3px solid #8b6f1a',
              boxShadow:
                'inset 0 2px 6px rgba(255,255,255,0.5), inset 0 -3px 8px rgba(0,0,0,0.3)',
            }}
          >
            BOUI<br />OFFICIAL<br />SEAL
          </div>

          {/* RIBBON */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '22px solid transparent',
              borderRight: '22px solid transparent',
              borderTop: '60px solid #1e3a8a',
              margin: '0 auto',
              marginTop: -8,
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
            zIndex: 5,
          }}
        >
          <p style={{ marginBottom: 4 }}>Digital Signature</p>

          <img src="/founder-signature.png" width={140} />

          <div
            style={{
              borderTop: '1px solid #000',
              marginTop: 6,
              paddingTop: 4,
              fontSize: 14,
            }}
          >
            Akata Patrick Ignatius
          </div>
        </div>
      </div>
    </div>
  );
}