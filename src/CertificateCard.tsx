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

export default function CertificateCard({
  data,
  mode = 'responsive',
}: Props) {
  const isExport = mode === 'export';

  const createdDate = data.created_at
    ? new Date(data.created_at).toLocaleString()
    : 'Unknown date';

  return (
    <div
      style={{
        width: isExport ? 1120 : '100%',
        minHeight: isExport ? 794 : 640,
        margin: '0 auto',
        padding: isExport ? 60 : 30,
        background: '#f5efe0',
        border: '4px solid #c9a227',
        borderRadius: 18,
        fontFamily: 'Georgia, serif',
        color: '#1a1a1a', // 🔥 stronger text color
        position: 'relative',
      }}
    >
      {/* WATERMARK (VERY FAINT, FIXED) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isExport ? 160 : 90,
          fontWeight: 900,
          color: '#000',
          opacity: 0.015, // 🔥 reduced interference
          transform: 'rotate(-20deg)',
          pointerEvents: 'none',
        }}
      >
        BOUI VERIFIED
      </div>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1
            style={{
              fontSize: isExport ? 36 : 26,
              fontWeight: 900,
              color: '#000', // 🔥 strong black
              letterSpacing: 1,
            }}
          >
            CERTIFICATE OF AUTHENTICITY
          </h1>

          <p style={{ color: '#333', marginTop: 8 }}>
            Issued by Bank of Unique Ideas Registry
          </p>
        </div>

        {/* PHOTO */}
        <div
          style={{
            width: 120,
            height: 140,
            border: '2px solid #c9a227',
            borderRadius: 10,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          {data.avatar_url ? (
            <img
              src={data.avatar_url}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 50 }}>
              Photo
            </div>
          )}
        </div>
      </div>

      {/* CENTER */}
      <div style={{ textAlign: 'center', marginTop: 60 }}>
        <p style={{ fontSize: 20, color: '#333' }}>Presented to</p>

        <h2
          style={{
            fontSize: isExport ? 54 : 36,
            fontWeight: 900,
            color: '#000', // 🔥 strong visibility
            margin: '15px 0',
          }}
        >
          {data.full_name || 'Unnamed Inventor'}
        </h2>

        <p style={{ fontSize: 18, color: '#444' }}>
          For the registered innovation
        </p>

        <h3
          style={{
            fontSize: isExport ? 42 : 28,
            color: '#8b6f1a',
            fontWeight: 900,
            marginTop: 15,
          }}
        >
          {data.title || 'Untitled Idea'}
        </h3>

        {/* DETAILS (🔥 FIXED VISIBILITY) */}
        <div style={{ marginTop: 40, lineHeight: 2.2, fontSize: 18 }}>
          <p>
            <strong style={{ color: '#000' }}>Category:</strong>{' '}
            <span style={{ color: '#111' }}>
              {data.category || 'General'}
            </span>
          </p>

          <p>
            <strong style={{ color: '#000' }}>Status:</strong>{' '}
            <span style={{ color: '#111' }}>
              Protected & Recorded
            </span>
          </p>

          <p>
            <strong style={{ color: '#000' }}>Certificate ID:</strong>{' '}
            <span style={{ color: '#111' }}>
              {data.verification_code || 'N/A'}
            </span>
          </p>

          <p style={{ color: '#222' }}>
            Registered on {createdDate}
          </p>
        </div>
      </div>

      {/* 🔥 MODERN OFFICIAL SEAL (FIXED) */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          right: 70,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 30% 30%, #ffe08a, #c9a227 60%, #7a5d0c)',
          boxShadow:
            '0 6px 14px rgba(0,0,0,0.3), inset 0 2px 6px rgba(255,255,255,0.6), inset 0 -4px 10px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 12,
          color: '#2b2b2b',
          textAlign: 'center',
        }}
      >
        <div>
          BOUI<br />
          VERIFIED<br />
          SEAL
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          marginTop: 80,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <p>Authorized by</p>
          <strong>Bank of Unique Ideas</strong>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p>Digital Signature</p>

          <img
            src="/founder-signature.png"
            style={{ width: 150 }}
          />

          <div
            style={{
              borderTop: '1px solid #333',
              marginTop: 6,
              paddingTop: 4,
            }}
          >
            Akata Patrick Ignatius
          </div>
        </div>
      </div>
    </div>
  );
}