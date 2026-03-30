type Props = {
  titleScore: number;
  licensingFit: string;
  patentSafety: string;
  investorAppeal: string;
  suggestions: string[];
};

export default function DepositIntelligencePanel({
  titleScore,
  licensingFit,
  patentSafety,
  investorAppeal,
  suggestions,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 sticky top-24">
      <h3 className="text-lg font-bold text-white">
        💡 IdeaShield Intelligence™
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <ScoreCard label="Title Power" value={`${titleScore}/10`} />
        <ScoreCard label="Licensing Fit" value={licensingFit} />
        <ScoreCard label="Patent Safety" value={patentSafety} />
        <ScoreCard label="Investor Appeal" value={investorAppeal} />
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white mb-2">🎯 Smart Suggestions</p>
        <ul className="space-y-2 text-sm text-white/70">
          {suggestions.map((s, i) => (
            <li key={i}>• {s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/30 p-3 border border-white/10">
      <p className="text-xs text-white/50">{label}</p>
      <p className="text-lg font-bold text-emerald-300">{value}</p>
    </div>
  );
}