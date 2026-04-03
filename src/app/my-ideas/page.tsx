'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import CertificateCard from '@/CertificateCard';

type IdeaRow = {
  id: string;
  title: string | null;
  status: 'pending' | 'confirmed' | 'blocked' | null;
  created_at: string | null;
  full_name?: string | null;
  category?: string | null;
  verification_code?: string | null;
};

export default function MyIdeasPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [exportIdea, setExportIdea] = useState<IdeaRow | null>(null);

  const certificateRef = useRef<HTMLDivElement>(null);

  // ================= LOAD =================
  useEffect(() => {
    let active = true;

    async function init() {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace('/login');
          return;
        }

        const { data, error } = await supabase
          .from('ideas')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!active) return;

        setIdeas((data ?? []) as IdeaRow[]);
      } catch (err: any) {
        if (active) setError(err?.message || 'Failed to load ideas.');
      } finally {
        if (active) setLoading(false);
      }
    }

    init();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  // ================= COUNTS =================
  const counts = useMemo(() => {
    return {
      pending: ideas.filter((i) => i.status === 'pending').length,
      confirmed: ideas.filter((i) => i.status === 'confirmed').length,
      blocked: ideas.filter((i) => i.status === 'blocked').length,
    };
  }, [ideas]);

  // ================= EXPORT ENGINE =================
  useEffect(() => {
    if (!exportIdea) return;

    async function runExport() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const node = certificateRef.current;
        if (!node) {
          throw new Error('Certificate DOM not ready');
        }

        const canvas = await html2canvas(node, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#020617',
          logging: false,
        });

        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [1120, 794],
        });

        pdf.addImage(imgData, 'PNG', 0, 0, 1120, 794);
       pdf.save(`BOUI-${exportIdea?.verification_code || exportIdea?.id}.pdf`);
      } catch (err) {
        console.error(err);
        alert('Certificate export failed.');
      } finally {
        setExportIdea(null);
      }
    }

    runExport();
  }, [exportIdea]);

  // ================= UI =================
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#020617',
        color: '#fff',
        padding: '100px 24px 40px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
            marginBottom: 30,
          }}
        >
          <div>
            <h1 style={{ fontSize: 40, fontWeight: 900, margin: 0 }}>
              My Ideas Vault
            </h1>
            <p style={{ color: '#cbd5e1', marginTop: 10 }}>
              Your protected deposits and released certificates.
            </p>
          </div>

          <Link
            href="/submit"
            style={{
              background: '#10b981',
              color: '#000',
              padding: '12px 22px',
              borderRadius: 999,
              fontWeight: 700,
              textDecoration: 'none',
              height: 'fit-content',
            }}
          >
            + Submit Idea
          </Link>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            marginBottom: 30,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: '#facc15' }}>Pending {counts.pending}</span>
          <span style={{ color: '#34d399' }}>Confirmed {counts.confirmed}</span>
          <span style={{ color: '#fb7185' }}>Blocked {counts.blocked}</span>
        </div>

        {loading && <p>Loading ideas...</p>}
        {error && <p style={{ color: '#f87171' }}>{error}</p>}

        {/* Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(350px,1fr))',
            gap: 20,
          }}
        >
          {ideas.map((idea) => (
            <div
              key={idea.id}
              style={{
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: 24,
              }}
            >
              <h2 style={{ fontSize: 28, fontWeight: 900 }}>
                {idea.title || 'Untitled'}
              </h2>

              <p style={{ color: '#94a3b8', marginBottom: 20 }}>
                {idea.category || 'General'}
              </p>

              {idea.status === 'confirmed' && (
                <>
                  <p style={{ color: '#34d399', marginBottom: 16 }}>
                    ✅ Confirmed · Certificate Ready
                  </p>

                  <button
                    onClick={() => setExportIdea(idea)}
                    style={{
                      background: '#99f6e4',
                      color: '#000',
                      border: 'none',
                      padding: '12px 22px',
                      borderRadius: 999,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    📄 Download Deposit Certificate
                  </button>
                </>
              )}

              {idea.status === 'pending' && (
                <p style={{ color: '#facc15' }}>
                  ⏳ Awaiting BOUI confirmation
                </p>
              )}

              {idea.status === 'blocked' && (
                <p style={{ color: '#fb7185' }}>❌ Blocked</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hidden export */}
      {exportIdea && (
        <div
          style={{
            position: 'fixed',
            left: '-99999px',
            top: 0,
            width: 1120,
            height: 794,
            background: '#020617',
          }}
        >
          <div ref={certificateRef}>
            <CertificateCard
              data={exportIdea}
              mode="export"
            />
          </div>
        </div>
      )}
    </main>
  );
}