'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ✅ FIXED IMPORT (adjust if needed)
import CertificateCard from '@/CertificateCard';
type IdeaRow = {
  id: string;
  title: string | null;
  status: 'pending' | 'confirmed' | 'blocked' | null;
  protected: boolean | null;
  created_at: string | null;
  notified?: boolean | null;
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

  /* ================= LOAD IDEAS ================= */
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

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.replace('/login');
          return;
        }

        await loadIdeas(user.id);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Failed to load ideas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true };
  }, [supabase, router]);

  /* ================= COUNTS ================= */
  const counts = useMemo(() => ({
    pending: ideas.filter(i => i.status === 'pending').length,
    confirmed: ideas.filter(i => i.status === 'confirmed').length,
    blocked: ideas.filter(i => i.status === 'blocked').length,
  }), [ideas]);

  /* ================= AUTO DOWNLOAD ================= */
  useEffect(() => {
    if (!downloadTrigger || !selectedIdea) return;

    const run = async () => {
      await new Promise(res => setTimeout(res, 400));

      if (!certificateRef.current) return;

      const canvas = await html2canvas(certificateRef.current, {
        scale: 3, // 🔥 high quality
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1120, 794], // 🔥 exact A4 landscape
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 1120, 794);

      pdf.save(`BUI-${selectedIdea.verification_code}.pdf`);

      // reset
      setDownloadTrigger(false);
      setSelectedIdea(null);
    };

    run();
  }, [downloadTrigger, selectedIdea]);

  /* ================= UI ================= */
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-6 pt-24 pb-10">

      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-300">
              My Ideas
            </h1>
            <p className="text-white/70">
              Only you and confirmed parties can view these ideas.
            </p>
          </div>

          <Link
            href="/submit"
            className="bg-emerald-400 px-4 py-2 rounded-full text-black"
          >
            Submit Idea
          </Link>
        </div>

        {/* COUNTS */}
        <div className="flex gap-4 text-sm flex-wrap">
          <span>Pending {counts.pending}</span>
          <span>Confirmed {counts.confirmed}</span>
          <span>Blocked {counts.blocked}</span>
        </div>

        {/* LOADING / ERROR */}
        {loading && <p>Loading...</p>}
        {err && <p className="text-red-400">{err}</p>}

        {/* IDEAS */}
        <div className="grid md:grid-cols-2 gap-4">
          {ideas.map((idea) => (
            <div key={idea.id} className="p-4 bg-black/40 rounded-xl">

              <h2 className="text-lg font-bold break-words">
                {idea.title}
              </h2>

              {idea.status === 'pending' && (
                <p className="text-yellow-300">
                  pending · 🔒 protected
                </p>
              )}

              {idea.status === 'blocked' && (
                <p className="text-red-300">
                  blocked · ❌
                </p>
              )}

              {idea.status === 'confirmed' && (
                <>
                  <p className="text-green-300">
                    confirmed · ✅ certificate ready
                  </p>

                  <button
                    onClick={() => {
                      setSelectedIdea(idea);
                      setDownloadTrigger(true);
                    }}
                    className="mt-3 bg-green-600 px-4 py-2 rounded-full text-sm"
                  >
                    📄 Download Certificate
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* 🔥 HIDDEN EXPORT (CRITICAL) */}
      {selectedIdea && (
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '1120px',
            height: '794px',
            background: '#020617'
          }}
        >
          <div ref={certificateRef}>
            <CertificateCard
              data={selectedIdea}
              mode="export" // 🔥 THIS FIXES SIZE ISSUE
            />
          </div>
        </div>
      )}

    </main>
  );
}