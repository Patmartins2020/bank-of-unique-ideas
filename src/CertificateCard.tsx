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
        background:
          'linear-gradient(135deg, #020617 0%, #0f172a 50%, #111827 100%)',
        border: '2px solid #00f2fe',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: 'Arial, Helvetica, sans-serif',
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
          opacity: 0.05,
          transform: 'rotate(-18deg)',
          pointerEvents: 'none',
        }}
      >
        VERIFIED
      </div>

      {/* top section */}
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
              fontSize: isExport ? 34 : 24,
              margin: 0,
              fontWeight: 900,
            }}
          >
            CERTIFICATE OF AUTHENTICITY
          </h1>
          <p style={{ color: '#cbd5e1', marginTop: 8 }}>
            Issued by Bank of Unique Ideas Registry
          </p>
        </div>

        {/* inventor photo */}
        <div
          style={{
            width: 120,
            height: 140,
            border: '2px solid #00f2fe',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#0f172a',
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
                color: '#94a3b8',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: 8,
              }}
            >
              Inventor Photo
            </div>
          )}
        </div>
      </div>

      {/* center */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          marginTop: 70,
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

        <p style={{ fontSize: 18 }}>For the registered innovation</p>

        <h3
          style={{
            fontSize: isExport ? 42 : 30,
            color: '#00f2fe',
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

      {/* footer */}
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
          <p style={{ margin: 0 }}>Authorized by</p>
          <strong>Bank of Unique Ideas</strong>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0 }}>Digital Signature</p>

          <img
            src="/founder-signature.png"
            alt="Founder Signature"
            style={{
              width: 160,
              marginTop: 6,
            }}
          />

          <div
            style={{
              width: 180,
              borderTop: '1px solid #94a3b8',
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