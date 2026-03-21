'use client';

export default function CertificateCard({
  data,
  mode = 'responsive',
}: {
  data: any;
  mode?: 'responsive' | 'export';
}) {
  const isExport = mode === 'export';

  return (
    <div
      style={{
        width: isExport ? '1120px' : '100%',
        height: isExport ? '794px' : 'auto',
        maxWidth: isExport ? '1120px' : 1000,
        margin: '0 auto',
        padding: isExport ? '60px' : 'clamp(16px, 4vw, 40px)',
        borderRadius: 20,
        background: '#020617',
        border: '2px solid #00f2fe',
        position: 'relative',
        overflow: 'hidden',
        color: 'white',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >

      {/* WATERMARK */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-20deg)',
          fontSize: isExport ? '120px' : 'clamp(40px, 10vw, 120px)',
          opacity: 0.05,
          fontWeight: 900
        }}
      >
        VERIFIED
      </div>

      {/* MAIN */}
      <div style={{
        textAlign: 'center',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        zIndex: 2
      }}>

        <h2 style={{
          fontSize: isExport ? '32px' : 'clamp(18px,4vw,28px)',
          fontWeight: 900
        }}>
          CERTIFICATE OF AUTHENTICITY
        </h2>

        <p style={{ opacity: 0.6 }}>
          Issued by Bank of Unique Ideas Registry
        </p>

        <div style={{ height: 20 }} />

        <p>Presented to</p>

        <h1 style={{
          fontSize: isExport ? '48px' : 'clamp(22px,6vw,36px)'
        }}>
          {data.full_name || 'Unnamed Inventor'}
        </h1>

        <div style={{ height: 20 }} />

        <p>For the registered innovation</p>

        <h2 style={{
          fontSize: isExport ? '34px' : 'clamp(18px,5vw,28px)',
          color: '#00f2fe'
        }}>
          {data.title}
        </h2>

        <div style={{ height: 20 }} />

        <p><b>Category:</b> {data.category}</p>
        <p><b>Status:</b> Protected & Recorded</p>

        <div style={{ height: 20 }} />

        <p><b>Certificate ID:</b></p>

        <h3>{data.verification_code}</h3>

        <p style={{ fontSize: 12 }}>
          Registered on {new Date(data.created_at).toLocaleString()}
        </p>

      </div>

      {/* FOOTER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
        opacity: 0.7
      }}>
        <div>
          <p>Authorized by</p>
          <b>Bank of Unique Ideas</b>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p>Digital Signature</p>
          <b>Verified System Seal</b>
        </div>
      </div>

    </div>
  );
}