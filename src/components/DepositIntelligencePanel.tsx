'use client';

import { useEffect, useRef, useState } from 'react';

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
  const [loading, setLoading] = useState(false);
  const [displayData, setDisplayData] = useState({
    titleScore,
    licensingFit,
    patentSafety,
    investorAppeal,
    suggestions,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // ✅ spinner starts immediately when user types
    setLoading(true);

    // clear previous pending update while still typing
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // ✅ only update AFTER user pauses typing
    timerRef.current = setTimeout(() => {
      setDisplayData({
        titleScore,
        licensingFit,
        patentSafety,
        investorAppeal,
        suggestions,
      });

      setLoading(false);
    }, 700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    titleScore,
    licensingFit,
    patentSafety,
    investorAppeal,
    suggestions,
  ]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 sticky top-24">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">
          💡 IdeaShield Intelligence™
        </h3>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <div className="h-4 w-4 rounded-full border-2 border-emerald-300 border-t-transparent animate-[spin_2.6s_linear_infinite]" />
            <span>Analyzing...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ScoreCard
          label="Title Power"
          value={`${displayData.titleScore}/10`}
        />
        <ScoreCard
          label="Licensing Fit"
          value={displayData.licensingFit}
        />
        <ScoreCard
          label="Patent Safety"
          value={displayData.patentSafety}
        />
        <ScoreCard
          label="Investor Appeal"
          value={displayData.investorAppeal}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white mb-2">
          🎯 Smart Suggestions
        </p>

        <ul className="space-y-2 text-sm text-white/70">
          {displayData.suggestions.map((s, i) => (
            <li key={i}>• {s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  function getExplanation() {
    if (label === 'Patent Safety') {
      if (value === 'Risky') {
        return 'Sensitive technical details were detected. Keep only the invention outcome, use-case, and business value in the deposit summary.';
      }

      if (value === 'Good') {
        return 'Some technical hints were detected, but the summary still keeps most sensitive implementation protected.';
      }

      return 'Excellent protection posture. Your deposit focuses on innovation value without exposing critical build details.';
    }

    if (label === 'Licensing Fit') {
      if (value === 'High') {
        return 'Strong licensing signals detected: enterprise, OEM, hospital, government, or scalable manufacturing routes.';
      }

      if (value === 'Medium') {
        return 'Licensing potential exists but could improve by mentioning enterprise or manufacturer use-cases.';
      }

      return 'Low licensing signals detected. Add clearer manufacturer, OEM, or B2B opportunities.';
    }

    if (label === 'Investor Appeal') {
      if (value === 'Strong') {
        return 'Excellent scale and monetization signals detected. Investors can easily see market expansion routes.';
      }

      if (value === 'Moderate') {
        return 'Moderate investor attractiveness. Adding growth, market size, or recurring revenue improves this.';
      }

      return 'Weak investor signals. Mention market size, recurring revenue, licensing, or global scalability.';
    }

    // Title Power
    const score = parseInt(value.split('/')[0] || '0');

    if (score >= 9) {
      return 'Excellent naming strength. The title is highly descriptive, memorable, and marketable.';
    }

    if (score >= 7) {
      return 'Good title structure. Consider adding clearer use-case or product differentiation.';
    }

    return 'Weak title strength. Add product + target use-case wording for stronger protection and licensing value.';
  }

  return (
    <div className="rounded-xl bg-black/30 p-3 border border-white/10 relative">
      <div className="flex items-center gap-2">
        <p className="text-xs text-white/50">{label}</p>

        <div className="relative group cursor-pointer">
          <span className="text-[10px] text-emerald-300 border border-emerald-300 rounded-full w-4 h-4 inline-flex items-center justify-center">
            i
          </span>

          <div className="absolute left-0 top-6 hidden group-hover:block z-20 w-64 rounded-lg border border-white/10 bg-slate-950 p-3 text-[11px] text-white/70 shadow-xl">
            {getExplanation()}
          </div>
        </div>
      </div>

      <p className="text-lg font-bold text-emerald-300">{value}</p>
    </div>
  );
}