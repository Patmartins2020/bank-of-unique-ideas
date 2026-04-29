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

  const enrichedIdeas = await Promise.all(
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

  setIdeas(enrichedIdeas as IdeaRow[]);
}

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setLoading(true);
        setErr(null);

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
  }, [router, supabase]);

  const counts = useMemo(
    () => ({
      pending: ideas.filter((i) => i.status === 'pending').length,
      confirmed: ideas.filter((i) => i.status === 'confirmed').length,
      blocked: ideas.filter((i) => i.status === 'blocked').length,
    }),
    [ideas]
  );

  async function handleDownloadCertificate(idea: IdeaRow) {
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1120, 794],
      });

      // background
      pdf.setFillColor(5, 10, 30);
      pdf.rect(0, 0, 1120, 794, 'F');

      // luxury border
      pdf.setDrawColor(0, 242, 254);
      pdf.setLineWidth(3);
      pdf.rect(25, 25, 1070, 744);

      // inventor photo
      
      if (idea.avatar_url) {
        const photo = new Image();
        photo.crossOrigin = 'anonymous';
        photo.src = idea.avatar_url;

        await new Promise((resolve, reject) => {
          photo.onload = resolve;
          photo.onerror = reject;
        });

        pdf.addImage(photo, 'JPEG', 900, 60, 120, 140);
      } else {
        pdf.setDrawColor(0, 242, 254);
        pdf.rect(900, 60, 120, 140);
        pdf.setFontSize(12);
        pdf.setTextColor(255, 255, 255);
        pdf.text('Inventor Photo', 960, 135, {
          align: 'center',
        });
      }

      // title
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(34);
      pdf.text('CERTIFICATE OF AUTHENTICITY', 560, 90, {
        align: 'center',
      });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(18);
      pdf.text('Issued by Bank of Unique Ideas Registry', 560, 120, {
        align: 'center',
      });

      // presented to
      pdf.setFontSize(20);
      pdf.text('Presented to', 560, 220, {
        align: 'center',
      });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(60);
      pdf.text(idea.full_name || 'Unnamed Inventor', 560, 310, {
        align: 'center',
      });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(22);
      pdf.text('For the registered innovation', 560, 390, {
        align: 'center',
      });

      pdf.setTextColor(0, 242, 254);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(44);
      pdf.text(idea.title || 'Untitled Idea', 560, 470, {
        align: 'center',
      });

      // watermark
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(120);
      pdf.setGState(new (pdf as any).GState({ opacity: 0.05 }));
      pdf.text('VERIFIED', 560, 580, {
        align: 'center',
        angle: 335,
      });

      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

      // details
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.text(
        `Category: ${idea.category || 'General'}`,
        90,
        640
      );

      pdf.text(
        `Certificate ID: ${idea.verification_code || idea.id}`,
        90,
        680
      );

      pdf.text(
        `Registered on: ${new Date(
          idea.created_at || new Date().toISOString()
        ).toLocaleString()}`,
        90,
        720
      );

      // founder signature
      const signature = new Image();
      signature.src = '/founder-signature.png';

      await new Promise((resolve, reject) => {
        signature.onload = resolve;
        signature.onerror = reject;
      });

      pdf.addImage(signature, 'PNG', 840, 620, 140, 50);

      pdf.line(820, 680, 1030, 680);

      pdf.setFontSize(14);
      pdf.text('Akata Patrick Ignatius', 925, 700, {
        align: 'center',
      });

      pdf.setFontSize(11);
      pdf.text('Founder, Bank of Unique Ideas', 925, 718, {
        align: 'center',
      });

      pdf.save(`BOUI-${idea.verification_code || idea.id}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Certificate export failed.');
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-slate-950 to-neutral-900 text-white px-6 pt-24 pb-10">
      <div className="max-w-6xl mx-auto space-y-8">
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
             className="relative z-50 inline-flex items-center gap-2 text-sm px-5 py-2 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition"
          >
            + Submit Idea
          </Link>
        </div>

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

        <div className="grid gap-4 md:grid-cols-2">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="rounded-2xl border border-white/10 bg-black/40 p-5"
            >
              <h2 className="text-lg font-bold">
                {idea.title || 'Untitled'}
              </h2>

              <p className="text-xs text-white/40 mt-1">
                {idea.category || 'General'}
              </p>
{idea.status === 'pending' && (
  <div className="mt-4 space-y-2">
    <p className="text-yellow-300">
      ⏳ Paid · Awaiting BOUI Admin Confirmation
    </p>
    <p className="text-xs text-white/50">
      Your deposit has been secured. Certificate unlocks after admin review.
    </p>
  </div>
)}

{idea.status === 'blocked' && (
  <p className="mt-4 text-rose-300">
    ❌ Blocked
  </p>
)}

{idea.status === 'confirmed' && (
  <div className="mt-4 space-y-3">
    <p className="text-emerald-300">
      ✅ Confirmed · Certificate Ready
    </p>

    <button
      onClick={() => handleDownloadCertificate(idea)}
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
    </main>
  );
}