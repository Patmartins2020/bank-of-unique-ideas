export const dynamic = "force-dynamic";

export default function InvestorIdeaPage({
  params,
}: {
  params: Record<string, string | string[] | undefined>;
}) {
  return (
    <main style={{ padding: 30 }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>Investor Idea Page</h1>

      <p style={{ marginTop: 10 }}>
        <strong>Params object:</strong>
      </p>

      <pre
        style={{
          marginTop: 10,
          padding: 12,
          background: "#111",
          color: "#0f0",
          borderRadius: 8,
          overflow: "auto",
        }}
      >
        {JSON.stringify(params, null, 2)}
      </pre>

      <p style={{ marginTop: 10 }}>
        <strong>params.id:</strong> {String(params?.id ?? "")}
      </p>
    </main>
  );
}