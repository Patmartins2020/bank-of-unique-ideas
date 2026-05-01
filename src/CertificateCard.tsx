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
        borderRadius: 20,
        background: '#f5efe0',
        border: '3px solid #c9a227',
        color: '#1a1a1a',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: 'Georgia, serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >

      {/* WATERMARK (very faint, non-intrusive) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isExport ? 140 : 90,
          fontWeight: 900,
          color: '#8b6f1a',
          opacity: 0.03,
          transform: 'rotate(-18deg)',
          pointerEvents: 'none',
        }}
      >
        BOUI VERIFIED
      </div>

      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: isExport ? 36 : 26,
              margin: 0,
              fontWeight: 900,
              color: '#2b1d0e',
              letterSpacing: 1,
            }}
          >
            CERTIFICATE OF AUTHENTICITY
          </h1>

          <p
            style={{
              color: '#5a4a2c',
              marginTop: 8,
              fontSize: 14,
            }}
          >
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
                color: '#777',
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

      {/* BODY */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 70,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <p
          style={{
            fontSize: 18,
            color: '#444',
          }}
        >
          Presented to
        </p>

        <h2
          style={{
            fontSize: isExport ? 54 : 38,
            fontWeight: 900,
            margin: '12px 0',
            color: '#1a1a1a',
            letterSpacing: 1,
          }}
        >
          {data.full_name || 'Unnamed Inventor'}
        </h2>

        <p
          style={{
            fontSize: 18,
            color: '#444',
          }}
        >
          For the registered innovation
        </p>

        <h3
          style={{
            fontSize: isExport ? 42 : 30,
            color: '#8b6f1a',
            marginTop: 16,
            fontWeight: 900,
          }}
        >
          {data.title || 'Untitled Idea'}
        </h3>

        {/* DETAILS */}
        <div
          style={{
            marginTop: 50,
            lineHeight: 2,
            fontSize: 15,
            color: '#333',
          }}
        >
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

      {/* SEAL */}
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
            '0 4px 10px rgba(0,0,0,0.25), inset 0 2px 6px rgba(255,255,255,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: isExport ? 12 : 9,
          fontWeight: 700,
          color: '#2b1d0e',
          transform: 'rotate(-12deg)',
        }}
      >
        BOUI<br />
        OFFICIAL<br />
        SEAL
      </div>

      {/* FOOTER */}
      <div
        style={{
          marginTop: 70,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 14 }}>
            Authorized by
          </p>

          <strong style={{ color: '#2b1d0e' }}>
            Bank of Unique Ideas
          </strong>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            Digital Signature
          </p>

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
              color: '#333',
            }}
          >
            Akata Patrick Ignatius
          </div>
        </div>
      </div>
    </div>
  );
}