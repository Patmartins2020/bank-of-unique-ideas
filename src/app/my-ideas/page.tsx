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
  protected: boolean | null;
  created_at: string | null;
  full_name?: string | null;
  category?: string | null;
  verification_code?: string | null;
  idea_hash?: string | null;
};

export default function MyIdeasPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);

  const [selectedIdea, setSelectedIdea] = useState<IdeaRow | null>(null);
  const [downloadTrigger, setDownloadTrigger] = useState(false);

  const certificateRef = useRef<HTMLDivElement>(null);

  // ================= LOAD =================
  async function loadIdeas(userId: string) {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setIdeas((data ?? []) as IdeaRow[]);
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setErr(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace('/login');
          return;
        }

        await loadIdeas(user.id);
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || 'Failed to load ideas.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  // ================= COUNTS =================
  const counts = useMemo(
    () => ({
      pending: ideas.filter((i) => i.status === 'pending').length,
      confirmed: ideas.filter((i) => i.status === 'confirmed').length,
      blocked: ideas.filter((i) => i.status === 'blocked').length,
    }),
    [ideas]
  );

  // ================= PDF EXPORT =================
  useEffect(() => {
    if (!downloadTrigger || !selectedIdea) return;

    const run = async () => {
      await new Promise((res) => setTimeout(res, 500));

      if (!certificateRef.current) return;

      const canvas = await html2canvas(certificateRef.current, {
        scale: 3,
        useCORS: true,
        width: 1120,
        height: 794,
        windowWidth: 1120,
        windowHeight: 794,
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1120, 794],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 1120, 794);

      pdf.save(`BOUI-${selectedIdea.verification_code}.pdf`);

      setDownloadTrigger(false);
      setSelectedIdea(null);
    };

    run();
  }, [downloadTrigger, selectedIdea]);

  // ================= UI =================
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-6 pt-24 pb-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-300">
              My Ideas Vault
            </h1>
            <p className="text-white/70">
              Your protected deposits and released certificates.
            </p>
          </div>

          <Link
            href="/submit"
            className="rounded-full bg-emerald-400 px-5 py-2 text-black font-semibold"
          >
            + Submit Idea
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-4 flex-wrap text-sm">
          <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-yellow-300">
            Pending {counts.pending}
          </span>

          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300">
            Confirmed {counts.confirmed}
          </span>

          <span className="rounded-full bg-rose-500/10 px-3 py-1 text-rose-300">
            Blocked {counts.blocked}
          </span>
        </div>

        {loading && <p>Loading ideas...</p>}
        {err && <p className="text-red-400">{err}</p>}

        {/* Ideas Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="rounded-2xl border border-white/10 bg-black/40 p-5"
            >
              <h2 className="text-lg font-bold break-words">
                {idea.title || 'Untitled'}
              </h2>

              <p className="text-xs text-white/40 mt-1">
                {idea.category || 'General'}
              </p>

              {/* Pending */}
              {idea.status === 'pending' && (
                <div className="mt-4 space-y-2">
                  <p className="text-yellow-300 font-medium">
                    ⏳ Awaiting BOUI confirmation
                  </p>
                  <p className="text-xs text-white/60">
                    Your idea is securely protected.
                    Certificate release happens after admin confirmation.
                  </p>
                </div>
              )}

              {/* Blocked */}
              {idea.status === 'blocked' && (
                <div className="mt-4 space-y-2">
                  <p className="text-rose-300 font-medium">
                    ❌ Blocked
                  </p>
                  <p className="text-xs text-white/60">
                    This deposit is unavailable for certificate release.
                  </p>
                </div>
              )}

              {/* Confirmed */}
              {idea.status === 'confirmed' && (
                <div className="mt-4 space-y-3">
                  <p className="text-emerald-300 font-medium">
                    ✅ Confirmed · Certificate Ready
                  </p>

                  <button
                    onClick={() => {
                      setSelectedIdea(idea);
                      setDownloadTrigger(true);
                    }}
                    className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
                  >
                    📄 Download Deposit Certificate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hidden certificate export */}
      {selectedIdea && (
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '1120px',
            height: '794px',
            background: '#020617',
          }}
        >
          <div ref={certificateRef}>
            <CertificateCard
              data={selectedIdea}
              mode="export"
            />
          </div>
        </div>
      )}
    </main>
  );
}