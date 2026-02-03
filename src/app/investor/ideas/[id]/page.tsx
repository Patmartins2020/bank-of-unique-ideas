// src/app/investor/ideas/[id]/page.tsx

type PageProps = {
  params: {
    id: string;
  };
};

export default function InvestorIdeaPage({ params }: PageProps) {
  const ideaId = params?.id;

  return (
    <main className="min-h-screen bg-[#020617] text-white px-6 pt-24 pb-10">
      <div className="max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl font-extrabold text-emerald-300">
          Investor Idea Page ✅
        </h1>

        <p className="text-white/80">
          Captured Idea ID:
          <span className="ml-2 font-bold text-white">{ideaId}</span>
        </p>
      </div>
    </main>
  );
}