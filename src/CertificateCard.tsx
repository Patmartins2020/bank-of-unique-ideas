'use client';

import QRCode from 'qrcode';
import { QRCodeCanvas } from 'qrcode.react';

export default function CertificateCard({ data }: { data: any }) {
const verifyUrl = `/verify/${data.verification_code}`;

  return (
    <div
      style={{
        width: '1120px',
        height: '794px',
        margin: '0 auto',
        padding: '60px',
        borderRadius: '20px',
        background: 'radial-gradient(circle at top, #0f172a, #020617)',
        border: '4px solid gold',
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'serif'
      }}
    >

      {/* 🔥 GOLD CORNER DECOR */}
      <div style={{
        position: 'absolute',
        inset: 10,
        border: '1px solid rgba(255,215,0,0.3)',
        borderRadius: 16
      }} />

      {/* 🔥 WATERMARK */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-20deg)',
          fontSize: '130px',
          opacity: 0.04,
          fontWeight: 900,
          letterSpacing: 12
        }}
      >
        VERIFIED
      </div>

      {/* 🔥 HEADER */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: 42,
          fontWeight: 900,
          letterSpacing: 2
        }}>
          BANK OF UNIQUE IDEAS
        </h1>

        <p style={{ opacity: 0.6 }}>
          Official Innovation Registry
        </p>
      </div>

      {/* 🔥 MAIN BODY */}
      <div style={{
        textAlign: 'center',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>

        <h2 style={{
          fontSize: 32,
          fontWeight: 800,
          marginBottom: 10
        }}>
          CERTIFICATE OF AUTHENTICITY
        </h2>

        <p style={{ opacity: 0.7 }}>Presented to</p>

        <h1 style={{
          fontSize: 52,
          fontWeight: 900,
          marginTop: 10
        }}>
          {data.full_name || 'Unnamed Inventor'}
        </h1>

        <div style={{ height: 20 }} />

        <p>For the registered innovation</p>

        <h2 style={{
          fontSize: 34,
          color: '#00f2fe',
          fontWeight: 700,
          marginTop: 10
        }}>
          {data.title}
        </h2>

        <div style={{ height: 20 }} />

        <p><b>Category:</b> {data.category}</p>
        <p><b>Status:</b> Protected & Recorded</p>

        <div style={{ height: 20 }} />

        <p style={{ fontWeight: 700 }}>Certificate ID</p>

        <h3 style={{
          fontSize: 22,
          letterSpacing: 2
        }}>
          {data.verification_code}
        </h3>

        <p style={{ fontSize: 12, marginTop: 10 }}>
          Registered on {new Date(data.created_at).toLocaleString()}
        </p>

        {/* 🔐 HASH */}
        <p style={{
          fontSize: 10,
          marginTop: 15,
          opacity: 0.5,
          wordBreak: 'break-all'
        }}>
          SHA-256: {data.idea_hash || 'N/A'}
        </p>

      </div>

      {/* 🔥 FOOTER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
      }}>

        {/* LEFT SIGNATURE */}
        <div>
          <p style={{ fontSize: 12 }}>Authorized by</p>
          <b>Bank of Unique Ideas</b>
        </div>

        {/* CENTER SEAL */}
        <div style={{
          textAlign: 'center',
          opacity: 0.7
        }}>
          <p style={{ fontSize: 12 }}>Digital Seal</p>
          <b>Verified Registry System</b>
        </div>

        {/* RIGHT QR */}
        <div style={{ textAlign: 'right' }}>
          {verifyUrl && (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}`}
              alt="QR Code"
              style={{ width: 90, height: 90, borderRadius: 8 }}
            />
          )}
          {/* <p style={{ fontSize: 10, marginTop: 4 }}>Scan to verify</p> */}
        </div>

      </div>

    </div>
  );
}