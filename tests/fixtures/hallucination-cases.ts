/**
 * Challenging Hallucination Test Cases
 * 
 * These test cases are designed to stress-test the hallucination detection engine.
 * Each case includes the content, expected risk level, and reasoning.
 */

export interface HallucinationTestCase {
  id: string;
  name: string;
  content: string;
  expectedRiskLevel: 'low' | 'moderate' | 'high';
  category: string;
  notes: string;
}

export const hallucinationTestCases: HallucinationTestCase[] = [
  // ==========================================================================
  // FABRICATED STATISTICS
  // ==========================================================================
  {
    id: 'fab-stat-1',
    name: 'Fabricated precise statistics',
    content: 'According to a 2024 study by Harvard Medical School, exactly 73.4% of patients who consumed green tea daily showed a 47.2% reduction in cardiovascular disease risk within 6 months.',
    expectedRiskLevel: 'high',
    category: 'fabricated-statistics',
    notes: 'Overly precise statistics without verifiable source'
  },
  {
    id: 'fab-stat-2',
    name: 'Fake survey results',
    content: 'A recent survey of 10,847 software developers found that 89.3% prefer TypeScript over JavaScript, with 94.7% reporting increased productivity.',
    expectedRiskLevel: 'high',
    category: 'fabricated-statistics',
    notes: 'Specific numbers that appear authoritative but are unverifiable'
  },
  {
    id: 'fab-stat-3',
    name: 'Invented economic data',
    content: 'The GDP of Wakanda grew by 234% in Q3 2024, making it the fastest-growing economy in Africa according to the World Bank.',
    expectedRiskLevel: 'high',
    category: 'fabricated-statistics',
    notes: 'References fictional country with real institution'
  },

  // ==========================================================================
  // FALSE CITATIONS
  // ==========================================================================
  {
    id: 'false-cite-1',
    name: 'Non-existent research paper',
    content: 'As demonstrated in Smith et al. (2024) "Quantum Effects in Neural Networks" published in Nature, quantum computing can solve NP-hard problems in polynomial time.',
    expectedRiskLevel: 'high',
    category: 'false-citations',
    notes: 'Fabricated citation with plausible-sounding title'
  },
  {
    id: 'false-cite-2',
    name: 'Misattributed quote',
    content: 'Albert Einstein once said, "The definition of insanity is doing the same thing over and over and expecting different results."',
    expectedRiskLevel: 'moderate',
    category: 'false-citations',
    notes: 'Commonly misattributed quote'
  },
  {
    id: 'false-cite-3',
    name: 'Fake historical document',
    content: 'The Treaty of Digital Rights, signed in Geneva in 2019 by 47 nations, established the fundamental right to internet access as a human right.',
    expectedRiskLevel: 'high',
    category: 'false-citations',
    notes: 'Fabricated international agreement'
  },

  // ==========================================================================
  // OVERCONFIDENT CLAIMS
  // ==========================================================================
  {
    id: 'overconf-1',
    name: 'Absolute certainty on uncertain topic',
    content: 'It is absolutely certain that consciousness arises from quantum processes in microtubules. There is no doubt whatsoever that this theory is correct.',
    expectedRiskLevel: 'high',
    category: 'overconfident-claims',
    notes: 'Absolute certainty on highly debated scientific topic'
  },
  {
    id: 'overconf-2',
    name: 'Definitive medical advice',
    content: 'This treatment will definitely cure your condition. There is a 100% success rate with no side effects whatsoever.',
    expectedRiskLevel: 'high',
    category: 'overconfident-claims',
    notes: 'Medical claims with impossible certainty'
  },
  {
    id: 'overconf-3',
    name: 'Future prediction as fact',
    content: 'By 2030, all cars will be fully autonomous. This is an inevitable outcome that cannot be prevented.',
    expectedRiskLevel: 'moderate',
    category: 'overconfident-claims',
    notes: 'Prediction stated as certain fact'
  },

  // ==========================================================================
  // CONTRADICTORY STATEMENTS
  // ==========================================================================
  {
    id: 'contra-1',
    name: 'Direct contradiction',
    content: 'The project was completed on time. However, the deadline was missed by three weeks due to unforeseen circumstances.',
    expectedRiskLevel: 'high',
    category: 'contradictions',
    notes: 'Direct logical contradiction within same response'
  },
  {
    id: 'contra-2',
    name: 'Numerical contradiction',
    content: 'The company has 500 employees. With a team of 750 people, they managed to complete the project.',
    expectedRiskLevel: 'high',
    category: 'contradictions',
    notes: 'Contradictory numbers in same context'
  },
  {
    id: 'contra-3',
    name: 'Temporal contradiction',
    content: 'The event occurred in 1995. This happened five years before the 1985 incident that caused it.',
    expectedRiskLevel: 'high',
    category: 'contradictions',
    notes: 'Impossible timeline'
  },

  // ==========================================================================
  // VAGUE AUTHORITY APPEALS
  // ==========================================================================
  {
    id: 'vague-auth-1',
    name: 'Unnamed experts',
    content: 'Many experts agree that this approach is the best. Studies have shown significant improvements.',
    expectedRiskLevel: 'moderate',
    category: 'vague-authority',
    notes: 'Appeals to unnamed experts and unspecified studies'
  },
  {
    id: 'vague-auth-2',
    name: 'Unverifiable consensus',
    content: 'Scientists universally accept this theory. Research consistently demonstrates these results.',
    expectedRiskLevel: 'moderate',
    category: 'vague-authority',
    notes: 'Claims of universal consensus without evidence'
  },
  {
    id: 'vague-auth-3',
    name: 'Anonymous sources',
    content: 'According to sources familiar with the matter, the company is planning a major acquisition worth billions.',
    expectedRiskLevel: 'moderate',
    category: 'vague-authority',
    notes: 'Anonymous sources for significant claims'
  },

  // ==========================================================================
  // PLAUSIBLE BUT FALSE FACTS
  // ==========================================================================
  {
    id: 'plaus-false-1',
    name: 'Plausible historical fact',
    content: 'The Great Wall of China is visible from space with the naked eye, making it the only man-made structure with this distinction.',
    expectedRiskLevel: 'moderate',
    category: 'plausible-false',
    notes: 'Common misconception stated as fact'
  },
  {
    id: 'plaus-false-2',
    name: 'Plausible scientific claim',
    content: 'Humans only use 10% of their brain capacity. Unlocking the remaining 90% could lead to superhuman abilities.',
    expectedRiskLevel: 'moderate',
    category: 'plausible-false',
    notes: 'Popular myth presented as scientific fact'
  },
  {
    id: 'plaus-false-3',
    name: 'Plausible technical claim',
    content: 'Deleting files from your computer permanently removes them from existence. The data is completely destroyed.',
    expectedRiskLevel: 'moderate',
    category: 'plausible-false',
    notes: 'Technically incorrect but plausible-sounding'
  },

  // ==========================================================================
  // MIXED TRUE AND FALSE
  // ==========================================================================
  {
    id: 'mixed-1',
    name: 'True context with false detail',
    content: 'Python was created by Guido van Rossum in 1991 at Bell Labs, where he was working on the Unix operating system.',
    expectedRiskLevel: 'moderate',
    category: 'mixed-truth',
    notes: 'Correct creator and year, wrong location and context'
  },
  {
    id: 'mixed-2',
    name: 'Mostly true with fabricated quote',
    content: 'Steve Jobs founded Apple in 1976. In his famous 2005 Stanford speech, he said "Stay hungry, stay foolish, and never trust a computer you cannot lift."',
    expectedRiskLevel: 'moderate',
    category: 'mixed-truth',
    notes: 'Real speech with fabricated addition to quote'
  },
  {
    id: 'mixed-3',
    name: 'Real event with wrong details',
    content: 'The Apollo 11 mission landed on the Moon on July 20, 1969. Neil Armstrong and Buzz Aldrin spent 48 hours on the lunar surface.',
    expectedRiskLevel: 'moderate',
    category: 'mixed-truth',
    notes: 'Correct date, incorrect duration (actual was about 2.5 hours outside)'
  },

  // ==========================================================================
  // SPECULATIVE LANGUAGE
  // ==========================================================================
  {
    id: 'spec-1',
    name: 'Speculation as fact',
    content: 'The new iPhone will have a foldable screen and holographic display. Apple has confirmed these features for the next release.',
    expectedRiskLevel: 'high',
    category: 'speculation',
    notes: 'Speculation presented as confirmed information'
  },
  {
    id: 'spec-2',
    name: 'Rumor as news',
    content: 'Sources indicate that the merger will be announced next week. The deal is valued at $50 billion.',
    expectedRiskLevel: 'moderate',
    category: 'speculation',
    notes: 'Unconfirmed business information with specific details'
  },

  // ==========================================================================
  // SAFE CONTENT (CONTROL CASES)
  // ==========================================================================
  {
    id: 'safe-1',
    name: 'Factual with hedging',
    content: 'Water boils at 100 degrees Celsius at sea level. This temperature may vary at different altitudes due to changes in atmospheric pressure.',
    expectedRiskLevel: 'low',
    category: 'safe',
    notes: 'Accurate information with appropriate caveats'
  },
  {
    id: 'safe-2',
    name: 'Opinion clearly stated',
    content: 'In my opinion, Python is a good language for beginners. However, others may prefer JavaScript or Ruby depending on their goals.',
    expectedRiskLevel: 'low',
    category: 'safe',
    notes: 'Opinion clearly marked as such'
  },
  {
    id: 'safe-3',
    name: 'Uncertainty acknowledged',
    content: 'The exact cause is not fully understood. Current research suggests several possible factors, but more studies are needed.',
    expectedRiskLevel: 'low',
    category: 'safe',
    notes: 'Appropriate acknowledgment of uncertainty'
  }
];

export default hallucinationTestCases;
