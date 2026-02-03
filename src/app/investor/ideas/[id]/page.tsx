// src/app/investor/ideas/[id]/page.tsx
import { createClient } from "@supabase/supabase-js";


type PageProps = {
  params: {
    id?: string;
  };
};

export default function InvestorIdeaPage({ params }: PageProps) {
  const ideaId = params?.id;

  if (!ideaId) {
    return (
      <main className="min-h-screen bg-[#020617] text-white px-6 pt-24">
        <h1 className="text-3xl font-extrabold text-red-500">
          Missing Idea ID
        </h1>
        <p className="text-white/70 mt-4">
          The route parameter <code>[id]</code> was not captured.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white px-6 pt-24">
      <h1 className="text-3xl font-extrabold text-emerald-300">
        Investor Idea Page ✅
      </h1>

      <p className="text-white/80 mt-4">
        Idea ID: <span className="text-white font-bold">{ideaId}</span>
      </p>
    </main>
  );
}