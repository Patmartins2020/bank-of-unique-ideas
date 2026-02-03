// src/app/investor/ideas/[id]/page.tsx
import { createClient } from "@supabase/supabase-js";

type PageProps = {
  params: { id: string };
};

export default async function InvestorIdeaPage({ params }: PageProps) {
  const ideaId = params?.id;

  if (!ideaId) {
    return (
      <main className="min-h-screen bg-[#020617] text-white px-6 pt-24">
        <h1 className="text-2xl font-bold text-red-400">Missing Idea ID</h1>
      </main>
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceKey) {
    return (
      <main className="min-h-screen bg-[#020617] text-white px-6 pt-24">
        <h1 className="text-2xl font-bold text-red-400">Server Config Error</h1>
        <p className="text-white/70 mt-2">
          Missing Supabase env variables on server.
        </p>
      </main>
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: idea, error } = await supabase
    .from("ideas")
    .select("id,title,description,created_at")
    .eq("id", ideaId)
    .maybeSingle();

  if (error) {
    return (
      <main className="min-h-screen bg-[#020617] text-white px-6 pt-24">
        <h1 className="text-2xl font-bold text-red-400">Error Loading Idea</h1>
        <p className="text-white/70 mt-2">{error.message}</p>
      </main>
    );
  }

  if (!idea) {
    return (
      <main className="min-h-screen bg-[#020617] text-white px-6 pt-24">
        <h1 className="text-2xl font-bold text-red-400">Idea Not Found</h1>
        <p className="text-white/70 mt-2">
          This idea does not exist or was removed.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white px-6 pt-24 pb-16">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl font-extrabold text-emerald-300">
          {idea.title || "Untitled Idea"}
        </h1>

        <p className="text-white/70 text-sm">
          Idea ID: <span className="text-white">{idea.id}</span>
        </p>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h2 className="text-xl font-bold mb-2">Description</h2>
          <p className="text-white/80 leading-relaxed">
            {idea.description || "No description available."}
          </p>
        </div>
      </div>
    </main>
  );
}