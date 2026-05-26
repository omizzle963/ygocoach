export type CardCategory = 'starter' | 'handtrap' | 'breaker' | 'jolly' | 'garnet' | 'brick' | 'other';

export interface CardItem {
  id: string;
  category: CardCategory;
  name: string;
  displayName: string;
  isExtender?: boolean;
}

export interface DeckConfig {
  deckSize: number;
  handSize: number;
  starterCount: number;
  starterExtendersCount?: number;
  minStarter: number;
  handtrapCount: number;
  minHandtrap: number;
  breakerCount: number;
  minBreaker: number;
  jollyCount: number;
  jollyActsAsStarter?: boolean;
  jollyActsAsHandtrap?: boolean;
  jollyActsAsBreaker?: boolean;
  garnetCount: number;
  maxGarnet: number;
  brickCount: number;
  minBrick: number;
  deckStrategy: string;
  deckName: string;
}

export interface HandEvaluation {
  score: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  title: string;
  description: string;
  reasons: string[];
}

export interface SimulationResult {
  overallProbability: number;
  comboOpeningOdds: number;
  handQualityScore: number;
  indHandtrapProb: number;
  indBreakerProb: number;
  indBrickProb: number;
  indGarnetProb: number;
  diminishingReturns: { starters: number; probability: number }[];
  advice: string;
  statusColor: string;
}

export interface BatchSimulationSummary {
  totalSims: number;
  averageScore: number;
  gradeDistribution: {
    'A+': number;
    'A': number;
    'B': number;
    'C': number;
    'D': number;
    'F': number;
  };
  brickRate: number; // Grade F %
  playableRate: number; // B and above %
}
