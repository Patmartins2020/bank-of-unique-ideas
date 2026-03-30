export type IntelligenceResult = {
  titleScore: number;
  licensingFit: 'Low' | 'Medium' | 'High';
  patentSafety: 'Risky' | 'Good' | 'Strong';
  investorAppeal: 'Weak' | 'Moderate' | 'Strong';
  suggestions: string[];
};

export function analyzeDeposit(
  title: string,
  summary: string
): IntelligenceResult {
  const text = `${title} ${summary}`.toLowerCase();
  const words = title.trim().split(/\s+/).filter(Boolean);

  let titleScore = 3;
  const suggestions: string[] = [];

  // ✅ stronger live title scoring
  if (words.length >= 2) titleScore += 2;
  if (words.length >= 4) titleScore += 2;
  if (words.length >= 6) titleScore += 1;

  if (/smart|ai|automated|solar|secure|portable|digital/.test(title)) {
    titleScore += 1;
  }

  if (/for|with|using|designed/.test(title)) {
    titleScore += 1;
  }

  if (/hospital|family|school|transport|security|fleet/.test(title)) {
    titleScore += 1;
  }

  if (title.length > 45) titleScore += 1;

  if (titleScore > 10) titleScore = 10;

  // ✅ better patent safety detection
  let patentSafety: IntelligenceResult['patentSafety'] = 'Strong';

  if (
    /secret formula|pcb|source code|algorithm steps|exact wiring|firmware|circuit/.test(
      text
    )
  ) {
    patentSafety = 'Risky';
    suggestions.push(
      'Hide sensitive implementation details from public summary.'
    );
  } else if (/prototype|mechanism|sensor|system|hardware/.test(text)) {
    patentSafety = 'Good';
  }

  // ✅ better licensing fit
  let licensingFit: IntelligenceResult['licensingFit'] = 'Low';

  if (/consumer|family|school|retail/.test(text)) {
    licensingFit = 'Medium';
  }

  if (
    /manufacturer|oem|fleet|hospital|government|enterprise|telecom/.test(text)
  ) {
    licensingFit = 'High';
  }

  // ✅ stronger investor scoring
  let investorAppeal: IntelligenceResult['investorAppeal'] = 'Weak';

  if (/market|revenue|consumer|growth/.test(text)) {
    investorAppeal = 'Moderate';
  }

  if (
    /global|scalable|subscription|licensing|saas|royalty|expansion/.test(text)
  ) {
    investorAppeal = 'Strong';
  }

  // ✅ smart suggestions
  if (titleScore < 8) {
    suggestions.push(
      'Strengthen title with product + use-case language.'
    );
  }

  if (!/market|industry|consumer|b2b|oem/.test(text)) {
    suggestions.push(
      'Mention target market for stronger investor routing.'
    );
  }

  if (!/license|royalty|sale|subscription|revenue/.test(text)) {
    suggestions.push(
      'Add monetization route for better licensing score.'
    );
  }

  return {
    titleScore,
    licensingFit,
    patentSafety,
    investorAppeal,
    suggestions,
  };
}