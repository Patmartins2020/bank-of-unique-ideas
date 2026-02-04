// src/app/investor/ideas/[id]/page.tsx

type Params = { id: string };

type PageProps = {
  params: Params | Promise<Params>;
};

export default async function InvestorIdeaPage({ params }: PageProps) {
  // Support both Next behaviors: params as object OR params as Promise
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;

  return (
    <main className="min-h-screen bg-[#020617] text-white px-6 py-10">
      <h1 className="text-3xl font-extrabold text-emerald-300">
        Investor Idea Page
      </h1>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-white/70">Captured Idea ID:</p>

        <p className="mt-2">
          <code className="rounded bg-black/40 px-2 py-1 text-white">
            {id || "❌ MISSING"}
          </code>
        </p>

        {!id && (
          <p className="mt-4 text-red-400">
            The route parameter <code>[id]</code> was not captured.
            <br />
            If this persists, it usually means a competing Pages Router route exists
            in <code>pages/</code> or <code>src/pages</code>.
          </p>
        )}
      </div>
    </main>
  );
}