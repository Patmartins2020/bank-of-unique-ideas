'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import jsPDF from 'jspdf';

type IdeaRow = {
  id: string;
  user_id: string;
  title: string | null;
  status: 'pending' | 'confirmed' | 'blocked' | null;
  protected: boolean | null;
  created_at: string | null;
  full_name?: string | null;
  category?: string | null;
  verification_code?: string | null;
  avatar_url?: string | null;
};

export default function MyIdeasPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);

  async function loadIdeas(userId: string) {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const enriched = await Promise.all(
      (data || []).map(async (idea) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', idea.user_id)
          .maybeSingle();

        return {
          ...idea,
          avatar_url: profile?.avatar_url || null,
        };
      })
    );

    setIdeas(enriched as IdeaRow[]);
  }

  useEffect(() => {
    async function init() {
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
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router, supabase]);

  const counts = useMemo(
    () => ({
      pending: ideas.filter((i) => i.status === 'pending').length,
      confirmed: ideas.filter((i) => i.status === 'confirmed').length,
      blocked: ideas.filter((i) => i.status === 'blocked').length,
    }),
    [ideas]
  );

  /* ================= DOWNLOAD ================= */

  async function handleDownloadCertificate(idea: IdeaRow) {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1120, 794],
    });

    // ✅ CREAM BACKGROUND (FIXED)
    pdf.setFillColor(245, 239, 224);
    pdf.rect(0, 0, 1120, 794, 'F');

    // border
    pdf.setDrawColor(201, 162, 39);
    pdf.setLineWidth(3);
    pdf.rect(25, 25, 1070, 744);

    pdf.setTextColor(40, 40, 40);
    pdf.setFontSize(32);
    pdf.text('CERTIFICATE OF AUTHENTICITY', 560, 100, {
      align: 'center',
    });

    pdf.setFontSize(18);
    pdf.text('Presented to', 560, 220, { align: 'center' });

    pdf.setFontSize(48);
    pdf.text(idea.full_name || 'Unnamed Inventor', 560, 300, {
      align: 'center',
    });

    pdf.setFontSize(20);
    pdf.text('For the registered innovation', 560, 360, {
      align: 'center',
    });

    pdf.setFontSize(36);
    pdf.text(idea.title || 'Untitled Idea', 560, 430, {
      align: 'center',
    });

    pdf.setFontSize(16);
    pdf.text(
      `Certificate ID: ${idea.verification_code}`,
      100,
      650
    );

    pdf.save(`BOUI-${idea.verification_code}.pdf`);
  }

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-6 pt-24 pb-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-emerald-300">
              My Ideas Vault
            </h1>
            <p className="text-white/60">
              Track your submissions and certificates
            </p>
          </div>

          <Link
            href="/submit"
            className="bg-white text-black px-5 py-2 rounded-lg font-semibold"
          >
            + Submit Idea
          </Link>
        </div>

        {/* COUNTS */}
        <div className="flex gap-3 text-sm">
          <span className="bg-yellow-500/10 px-3 py-1 rounded-full text-yellow-300">
            Pending {counts.pending}
          </span>
          <span className="bg-emerald-500/10 px-3 py-1 rounded-full text-emerald-300">
            Confirmed {counts.confirmed}
          </span>
          <span className="bg-red-500/10 px-3 py-1 rounded-full text-red-300">
            Blocked {counts.blocked}
          </span>
        </div>

        {loading && <p>Loading...</p>}
        {err && <p className="text-red-400">{err}</p>}

        {/* CARDS */}
        <div className="grid md:grid-cols-2 gap-5">

          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="bg-white/5 border border-white/10 rounded-xl p-5"
            >
              {/* TOP */}
              <div className="flex justify-between items-start">

                <div>
                  <h2 className="font-bold text-lg">
                    {idea.title}
                  </h2>
                  <p className="text-xs text-white/50">
                    {idea.category}
                  </p>
                </div>

                {/* AVATAR */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-black/40">
                  {idea.avatar_url && (
                    <img
                      src={idea.avatar_url}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* STATUS */}
              <div className="mt-4">

                {idea.status === 'pending' && (
                  <div className="text-yellow-300 text-sm">
                    ⏳ Under Admin Review
                    <p className="text-white/40 text-xs mt-1">
                      Certificate locked until approval
                    </p>
                  </div>
                )}

                {idea.status === 'blocked' && (
                  <div className="text-red-400 text-sm">
                    ❌ Blocked by Admin
                  </div>
                )}

                {idea.status === 'confirmed' && (
                  <div className="space-y-2">
                    <p className="text-emerald-300">
                      ✅ Approved
                    </p>

                    <div className="flex gap-3">

                      <button
                        onClick={() =>
                          handleDownloadCertificate(idea)
                        }
                        className="bg-emerald-400 text-black px-4 py-2 rounded-lg text-sm font-semibold"
                      >
                        Download Certificate
                      </button>

                      <Link
                        href={`/verify?code=${idea.verification_code}`}
                        className="text-sm underline text-emerald-300"
                      >
                        View
                      </Link>

                    </div>
                  </div>
                )}

              </div>
            </div>
          ))}

        </div>
      </div>
    </main>
  );
}