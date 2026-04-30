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
        maxWidth: isExport ? 1120 : 1000,
        margin: '0 auto',
        padding: isExport ? 60 : 30,
        borderRadius: 24,
        background: '#f5efe0',
        border: '2px solid #c9a227',
        color: '#2b2b2b',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: 'Georgia, serif',
      }}
    >
      {/* watermark */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isExport ? 140 : 90,
          fontWeight: 900,
          color: '#bfa76a',
          opacity: 0.02,
          transform: 'rotate(-18deg)',
          pointerEvents: 'none',
        }}
      >
        BOUI VERIFIED
      </div>

      {/* top */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          zIndex: 2,
          position: 'relative',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: isExport ? 34 : 24,
              margin: 0,
              fontWeight: 900,
              color: '#3b2f1c',
            }}
          >
            CERTIFICATE OF AUTHENTICITY
          </h1>
          <p style={{ color: '#7c6a3a', marginTop: 8 }}>
            Issued by Bank of Unique Ideas Registry
          </p>
        </div>

        {/* photo */}
        <div
          style={{
            width: 120,
            height: 140,
            border: '2px solid #c9a227',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#f5efe0',
          }}
        >
          {data.avatar_url ? (
            <img
              src={data.avatar_url}
              alt="Inventor"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                fontSize: 12,
                color: '#7c6a3a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              Photo
            </div>
          )}
        </div>
      </div>

      {/* center */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 70,
          zIndex: 2,
          position: 'relative',
        }}
      >
        <p style={{ fontSize: 20 }}>Presented to</p>

        <h2
          style={{
            fontSize: isExport ? 52 : 36,
            fontWeight: 900,
            margin: '16px 0',
          }}
        >
          {data.full_name || 'Unnamed Inventor'}
        </h2>

        <p style={{ fontSize: 18 }}>
          For the registered innovation
        </p>

        <h3
          style={{
            fontSize: isExport ? 42 : 30,
            color: ' #8b6f1a',
            marginTop: 18,
            fontWeight: 900,
          }}
        >
          {data.title || 'Untitled Idea'}
        </h3>

        <div style={{ marginTop: 50, lineHeight: 2 }}>
          <p>
            <strong>Category:</strong> {data.category || 'General'}
          </p>
          <p>
            <strong>Status:</strong> Protected & Recorded
          </p>
          <p>
            <strong>Certificate ID:</strong>{' '}
            {data.verification_code || 'N/A'}
          </p>
          <p>Registered on {createdDate}</p>
        </div>
      </div>

      {/* ✅ EMBOSSED SEAL */}
      <div
        style={{
          position: 'absolute',
          bottom: isExport ? 60 : 30,
          right: isExport ? 80 : 30,
          width: isExport ? 140 : 100,
          height: isExport ? 140 : 100,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 30% 30%, #f5d97a, #c9a227 60%, #8b6f1a)',
          boxShadow:
            '0 4px 10px rgba(0,0,0,0.25), inset 0 2px 6px rgba(255,255,255,0.4), inset 0 -3px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: isExport ? 12 : 9,
          fontWeight: 700,
          color: '#3b2f1c',
          transform: 'rotate(-12deg)',
          zIndex: 3,
        }}
      >
        <div>
          BOUI<br />
          OFFICIAL<br />
          SEAL
        </div>
      </div>

      {/* footer */}
      <div
        style={{
          marginTop: 70,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          zIndex: 2,
          position: 'relative',
        }}
      >
        <div>
          <p style={{ margin: 0 }}>Authorized by</p>
          <strong>Bank of Unique Ideas</strong>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0 }}>Digital Signature</p>

          <img
            src="/founder-signature.png"
            alt="Signature"
            style={{ width: 160, marginTop: 6 }}
          />

          <div
            style={{
              width: 180,
              borderTop: '1px solid #7c6a3a',
              marginTop: 6,
              paddingTop: 6,
              fontSize: 12,
            }}
          >
            Akata Patrick Ignatius
          </div>
        </div>
      </div>
    </div>
  );
}