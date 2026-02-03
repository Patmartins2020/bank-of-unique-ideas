export default function InvestorIdeaPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main style={{ padding: 30 }}>
      <h1 style={{ fontSize: 30, fontWeight: "bold" }}>Investor Idea Page ✅</h1>
      <p>Captured Idea ID: {params.id}</p>
    </main>
  );
}