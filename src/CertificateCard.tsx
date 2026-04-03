'use client';

type Props = {
  data: {
    full_name?: string | null;
    title?: string | null;
    category?: string | null;
    verification_code?: string | null;
    created_at?: string | null;
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
        height: isExport ? 794 : 'auto',
        minHeight: isExport ? 794 : 560,
        maxWidth: isExport ? 1120 : 1000,
        margin: '0 auto',
        padding: isExport ? 60 : 30,
        borderRadius: 20,
        backgroundColor: '#020617',
        border: '2px solid #00f2fe',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      {/* Watermark */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isExport ? 120 : 70,
          fontWeight: 900,
          color: '#ffffff',
          opacity: 0.04,
          transform: 'rotate(-18deg)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        VERIFIED
      </div>

      {/* Main content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <h2
          style={{
            fontSize: isExport ? 32 : 24,
            fontWeight: 900,
            margin: 0,
          }}
        >
          CERTIFICATE OF AUTHENTICITY
        </h2>

        <p
          style={{
            marginTop: 10,
            fontSize: 14,
            color: '#cbd5e1',
          }}
        >
          Issued by Bank of Unique Ideas Registry
        </p>

        <div style={{ height: 24 }} />

        <p style={{ fontSize: 16 }}>Presented to</p>

        <h1
          style={{
            fontSize: isExport ? 46 : 34,
            fontWeight: 900,
            margin: '8px 0',
          }}
        >
          {data.full_name || 'Unnamed Inventor'}
        </h1>

        <div style={{ height: 20 }} />

        <p style={{ fontSize: 16 }}>For the registered innovation</p>

        <h2
          style={{
            fontSize: isExport ? 34 : 28,
            fontWeight: 800,
            color: '#00f2fe',
            margin: '8px 0',
          }}
        >
          {data.title || 'Untitled Idea'}
        </h2>

        <div style={{ height: 24 }} />

        <p style={{ fontSize: 16 }}>
          <strong>Category:</strong> {data.category || 'General'}
        </p>

        <p style={{ fontSize: 16 }}>
          <strong>Status:</strong> Protected & Recorded
        </p>

        <div style={{ height: 24 }} />

        <p style={{ fontSize: 14 }}>
          <strong>Certificate ID:</strong>
        </p>

        <h3
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginTop: 6,
          }}
        >
          {data.verification_code || 'N/A'}
        </h3>

        <p
          style={{
            marginTop: 12,
            fontSize: 12,
            color: '#cbd5e1',
          }}
        >
          Registered on {createdDate}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#cbd5e1',
        }}
      >
        <div>
          <p style={{ margin: 0 }}>Authorized by</p>
          <strong>Bank of Unique Ideas</strong>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}>Digital Signature</p>
          <strong>Verified System Seal</strong>
        </div>
      </div>
    </div>
  );
}