import { CardCategory, CardItem, DeckConfig, HandEvaluation, BatchSimulationSummary } from '../types';

// Helper for combinations: n! / (k! * (n - k)!)
export function nCr(n: number, k: number): number {
  if (k < 0 || k > n || n < 0) return 0;
  if (k === 0 || k === n) return 1;
  let res = 1;
  const limit = Math.min(k, n - k);
  for (let i = 1; i <= limit; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

// Hypergeometric probability of drawing at least 1 card of a specific group
export function probAtLeastOne(deck: number, hand: number, target: number): number {
  if (target <= 0 || deck <= 0 || hand <= 0) return 0;
  const total = nCr(deck, hand);
  if (total === 0) return 0;
  const noTarget = nCr(deck - target, hand);
  return (1 - noTarget / total) * 100;
}

// Hypergeometric probability of drawing at least standard X cards from a target pool
export function probAtLeastX(deck: number, hand: number, targetCount: number, minRequired: number): number {
  if (targetCount <= 0 || deck <= 0 || hand <= 0 || minRequired < 0) return minRequired === 0 ? 100 : 0;
  if (minRequired > hand || minRequired > targetCount) return 0;
  const total = nCr(deck, hand);
  if (total === 0) return 0;
  let success = 0;
  for (let i = minRequired; i <= Math.min(hand, targetCount); i++) {
    success += nCr(targetCount, i) * nCr(deck - targetCount, hand - i);
  }
  return (success / total) * 100;
}

// Probability of drawing at least minStarter starters/jollies AND at most maxGarnet garnets
export function calculateComboOpeningOdds(deck: number, hand: number, state: DeckConfig): number {
  const totalHands = nCr(deck, hand);
  if (totalHands === 0) return 0;

  const S_J = state.starterCount + (state.jollyActsAsStarter ? state.jollyCount : 0);
  const G = state.garnetCount;
  const minS = state.minStarter;
  const maxG = state.maxGarnet;

  const Other = deck - (S_J + G);
  if (Other < 0) return 0;

  let successfulHands = 0;

  for (let sj = minS; sj <= Math.min(S_J, hand); sj++) {
    for (let g = 0; g <= Math.min(G, hand - sj); g++) {
      if (g <= maxG) {
        const other = hand - (sj + g);
        if (other >= 0 && other <= Other) {
          successfulHands += nCr(S_J, sj) * nCr(G, g) * nCr(Other, other);
        }
      }
    }
  }

  return (successfulHands / totalHands) * 100;
}

// Calculate the precise multi-variable hypergeometric probability
export function calculateExactProbability(deck: number, hand: number, state: DeckConfig): number {
  const totalHands = nCr(deck, hand);
  if (totalHands === 0) return 0;

  const S = state.starterCount;
  const HT = state.handtrapCount;
  const BB = state.breakerCount;
  const J = state.jollyCount;
  const G = state.garnetCount;
  const B = state.brickCount;
  
  const minS = state.minStarter;
  const minHT = state.minHandtrap;
  const minBB = state.minBreaker;
  const maxG = state.maxGarnet;
  const minB = state.minBrick || 0;

  const Other = deck - (S + HT + BB + J + G + B);
  if (Other < 0) return 0;

  let successfulHands = 0;

  // Loops for each card category drawn in the opening hand
  for (let s = 0; s <= Math.min(S, hand); s++) {
    for (let ht = 0; ht <= Math.min(HT, hand - s); ht++) {
      for (let bb = 0; bb <= Math.min(BB, hand - s - ht); bb++) {
        for (let j = 0; j <= Math.min(J, hand - s - ht - bb); j++) {
          for (let g = 0; g <= Math.min(G, hand - s - ht - bb - j); g++) {
            for (let b = 0; b <= Math.min(B, hand - s - ht - bb - j - g); b++) {
              const other = hand - (s + ht + bb + j + g + b);

              if (other >= 0 && other <= Other) {
                // Check Min Brick/Engine Req constraint
                if (b >= minB) {
                  const neededS = s >= minS ? 0 : (state.jollyActsAsStarter ? (minS - s) : -1);
                  const neededHT = ht >= minHT ? 0 : (state.jollyActsAsHandtrap ? (minHT - ht) : -1);
                  const neededBB = bb >= minBB ? 0 : (state.jollyActsAsBreaker ? (minBB - bb) : -1);

                  if (neededS !== -1 && neededHT !== -1 && neededBB !== -1 && (neededS + neededHT + neededBB <= j)) {
                    const ways =
                      nCr(S, s) *
                      nCr(HT, ht) *
                      nCr(BB, bb) *
                      nCr(J, j) *
                      nCr(G, g) *
                      nCr(B, b) *
                      nCr(Other, other);
                    successfulHands += ways;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return (successfulHands / totalHands) * 100;
}

// Generate coaching advice paragraph based on probability and config
export function generateAdvice(probability: number, state: DeckConfig): string {
  let advice = "";
  if (probability >= 80) {
    advice = "Your deck setup is exceptionally consistent! You will almost guarantee opening your required engine pieces with protective backup.";
  } else if (probability >= 60) {
    advice = "Solid competitive build. Your engine has competitive-level consistency, but watch out for small risk zones under extreme interruption pressures.";
  } else if (probability >= 40) {
    advice = "Slightly unstable or high variance. You may find yourself holding hands that cannot fully play or lack defensive interaction. Consider adding Jolly cards or more Starters.";
  } else {
    advice = "Mathematically risky. Your minimum prerequisites are too strict for the card counts in your deck. Try to lower your target constraints or add more Starters and versatile searchers.";
  }

  if (state.garnetCount > 0 && state.maxGarnet === 0) {
    advice += ` Warning: Drawing your ${state.garnetCount} Hard Garnet(s) will completely brick your plays. Running them increases variance.`;
  }
  if (state.jollyCount > 0) {
    advice += ` Your ${state.jollyCount} Jolly cards are successfully patching holes in your opening hands, functioning as flexible nodes.`;
  }
  if (state.brickCount > 3) {
    advice += ` Note that running ${state.brickCount} ordinary bricks increases the chance of dead opening cards. Consider downsizing them.`;
  }

  return advice;
}

// Define specific card names per category to make simulated hands feel real!
const SAMPLE_CARDS: Record<CardCategory, string[]> = {
  starter: ["Bonfire", "Snake-Eye Ash", "Branded Fusion", "A Hero Lives", "Purrely My Friend", "Tour Guide From the Underworld", "Rite of Aramesir", "WANTED: Seeker of Sinful Spoils", "Super Heavy Samurai Wakaushi", "Neo Space Connector"],
  handtrap: ["Ash Blossom & Joyous Spring", "Maxx \"C\"", "Infinite Impermanence", "Nibiru, the Primal Being", "Effect Veiler", "Ghost Belle & Haunted Mansion", "Droll & Lock Bird", "Dimension Shifter", "Psy-Framegear Gamma"],
  breaker: ["Triple Tactics Talent", "Forbidden Droplet", "Dark Ruler No More", "Lightning Storm", "Harpy's Feather Duster", "Cosmic Cyclone", "Evenly Matched", "Super Polymerization"],
  jolly: ["Pot of Prosperity", "Triple Tactics Thrust", "Small World", "One for One", "Foolish Burial", "Crossout Designator"],
  garnet: ["Psy-Frame Driver", "Red-Eyes Black Dragon", "Double Or Nothing!", "Branded Banishment", "Gem-Knight Garnet", "Therion \"King\" Regulus"],
  brick: ["Saronir", "Snake-Eyes Flamberge Dragon", "Visas Starfrost", "Destiny HERO - Dasher", "Primitive Butterfly"],
  other: ["Parallel eXceed", "Spooky Dogwood", "Called by the Grave", "Book of Moon", "Compulsory Evacuation Device", "Solemn Judgment", "Infinite Impermanence", "Sauravis the Ancient Sage"]
};

// Evaluate the precise Hand Quality, scoring it out of 100
export function evaluateHand(hand: (CardCategory | CardItem)[], config: DeckConfig): HandEvaluation {
  const isCardItem = (item: any): item is CardItem => typeof item === 'object' && item !== null && 'category' in item;

  // Count counts of categories in hand
  const sCards = hand.filter(c => (isCardItem(c) ? c.category : c) === 'starter');
  const s = sCards.length;
  const ht = hand.filter(c => (isCardItem(c) ? c.category : c) === 'handtrap').length;
  const bb = hand.filter(c => (isCardItem(c) ? c.category : c) === 'breaker').length;
  const j = hand.filter(c => (isCardItem(c) ? c.category : c) === 'jolly').length;
  const g = hand.filter(c => (isCardItem(c) ? c.category : c) === 'garnet').length;
  const b = hand.filter(c => (isCardItem(c) ? c.category : c) === 'brick').length;
  const other = hand.filter(c => (isCardItem(c) ? c.category : c) === 'other').length;

  let score = 50; // Neutral starting score
  const reasons: string[] = [];

  // 1. Check Combo Ability
  const reqS = Math.max(0, config.minStarter - s);
  const reqHT = Math.max(0, config.minHandtrap - ht);
  const reqBB = Math.max(0, config.minBreaker - bb);

  let remainingJ = j;
  let jollySpentForStarter = 0;
  if (config.jollyActsAsStarter !== false && reqS > 0) {
    jollySpentForStarter = Math.min(reqS, remainingJ);
    remainingJ -= jollySpentForStarter;
  }

  let jollySpentForHandtrap = 0;
  if (config.jollyActsAsHandtrap && reqHT > 0) {
    jollySpentForHandtrap = Math.min(reqHT, remainingJ);
    remainingJ -= jollySpentForHandtrap;
  }

  let jollySpentForBreaker = 0;
  if (config.jollyActsAsBreaker !== false && reqBB > 0) {
    jollySpentForBreaker = Math.min(reqBB, remainingJ);
    remainingJ -= jollySpentForBreaker;
  }

  const finalSCount = s + jollySpentForStarter;
  const finalHTCount = ht + jollySpentForHandtrap;
  const finalBBCount = bb + jollySpentForBreaker;

  const hasStarter = finalSCount >= config.minStarter;
  const satisfiesHT = finalHTCount >= config.minHandtrap;
  const satisfiesBB = finalBBCount >= config.minBreaker;
  const violatesGarnet = g > config.maxGarnet;
  const satisfiesBrick = b >= (config.minBrick || 0);

  if (hasStarter) {
    score += 25;
    reasons.push(`Core engine active: opened starter or versatile card to initiate your main plays (+25).`);
    
    // Evaluate extra starters as potential extenders or redundant cards
    if (s >= 2) {
      const extraStarters = s - 1;
      const extCountSupported = config.starterExtendersCount || 0;
      
      // Determine physical extenders drawn
      let extendersDrawn = 0;
      let hasPhysicalExtenders = false;
      
      const sCardItems = hand.filter((c): c is CardItem => isCardItem(c) && c.category === 'starter');
      if (sCardItems.length > 0) {
        hasPhysicalExtenders = true;
        extendersDrawn = sCardItems.filter(c => c.isExtender).length;
      }
      
      // Hypergeometric / Probabilistic simulation when we only have categories (or if no physical extenders are marked)
      if (!hasPhysicalExtenders && extCountSupported > 0) {
        const totalS = config.starterCount || 1;
        let pool = Array.from({ length: totalS }, (_, index) => index < extCountSupported);
        let simExtenders = 0;
        for (let k = 0; k < s; k++) {
          if (pool.length === 0) break;
          const idx = Math.floor(Math.random() * pool.length);
          if (pool[idx]) simExtenders++;
          pool.splice(idx, 1);
        }
        extendersDrawn = simExtenders;
      }

      const activeExtenders = Math.min(extraStarters, extendersDrawn);
      
      if (extCountSupported > 0) {
        if (activeExtenders > 0) {
          const extensionBonus = activeExtenders * 5;
          score += extensionBonus;
          reasons.push(`Engine extension: you opened ${s} starters of which ${activeExtenders} actually function as play extender(s) in this spec hand (+${extensionBonus}).`);
        }
        
        const remainingRedundant = extraStarters - activeExtenders;
        if (remainingRedundant > 0) {
          const redundancyPenalty = remainingRedundant * 5;
          score -= redundancyPenalty;
          reasons.push(`Engine redundancy: ${remainingRedundant} extra starter(s) in this hand are strictly redundant overlap / dead draws (-${redundancyPenalty}).`);
        }
      } else {
        // Legacy behavior: penalize redundancy if no extenders are configured
        if (s >= 3) {
          score -= 10;
          reasons.push(`Engine redundancy: opened ${s} starters. This causes diminishing returns / overlap (-10).`);
        }
      }
    }
  } else {
    score -= 35;
    reasons.push(`Combo bricked: failed to reach your configured minimum of ${config.minStarter} starter(s) (-35).`);
  }

  // 2. Defensive Hand Traps (Defensive Power)
  if (ht > 0) {
    if (ht === 1) {
      score += 15;
      reasons.push(`Opened 1 Hand Trap - key baseline interaction (+15).`);
    } else if (ht === 2) {
      score += 20;
      reasons.push(`Opened 2 Hand Traps - highly resilient defensive setup (+20).`);
    } else if (ht >= 3) {
      score += 15;
      if (hasStarter) {
        reasons.push(`Dense disruption: opened ${ht} Hand Traps. Great for stopping opponent (+15).`);
      } else {
        score -= 5;
        reasons.push(`Defensive overload: opened ${ht} Hand Traps with no engine. High interaction but can't play (-5).`);
      }
    }
  }

  // Check custom hand trap target config
  if (config.minHandtrap > 0) {
    if (satisfiesHT) {
      score += 5;
    } else {
      score -= 10;
      reasons.push(`Failed to hit handtrap target minimum of ${config.minHandtrap} (-10).`);
    }
  }

  // Check custom engine requirement / soft brick target config
  if (config.minBrick > 0) {
    if (satisfiesBrick) {
      score += 5;
      reasons.push(`Satisfied engine requirement: opened ${b} soft bricks/engine reqs (minimum target: ${config.minBrick}) (+5).`);
    } else {
      score -= 10;
      reasons.push(`Failed to hit engine requirement / soft brick target minimum of ${config.minBrick} (-10).`);
    }
  }

  // 3. Board Breakers (Going Second Value)
  if (bb > 0) {
    score += 5 * bb;
    reasons.push(`Opened ${bb} Board Breaker(s). Excellent tools for dismantling fields (+${5 * bb}).`);
  }

  // 4. Jolly Cards
  if (j > 0) {
    score += 5 * j;
    reasons.push(`Opened ${j} Jovial/Utility card(s) that provide custom flexible options (+${5 * j}).`);
  }

  // 5. Garnets (Hard Failures)
  if (g > 0) {
    if (violatesGarnet) {
      score -= 30;
      reasons.push(`Hard Garnet drawn! You exceeded your threshold of ${config.maxGarnet} Garnet(s) (-30).`);
    } else {
      score -= 12;
      reasons.push(`Garnet drawn, but within safe target parameters (-12).`);
    }
  }

  // 6. Engine Bricks (Clunkiness)
  if (b > 0) {
    score -= 5 * b;
    reasons.push(`Engine brick drawn: ${b} dead end card(s) caught in your openers (-${5 * b}).`);
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine Grade
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  let title = "";
  let description = "";

  if (score >= 95) {
    grade = 'A+';
    title = "God Hand";
    description = "A perfect competitive opening! Full engine starter, custom interruptions, and pristine ratios.";
  } else if (score >= 80) {
    grade = 'A';
    title = "Championship Ready";
    description = "Highly viable hand. You open your primary combo with defensive backups or generic utility.";
  } else if (score >= 65) {
    grade = 'B';
    title = "Playable";
    description = "Fully functional! You can start your plays, but you are vulnerable to handtrap counters or lack second-tier backups.";
  } else if (score >= 50) {
    grade = 'C';
    title = "Sub-Optimal";
    description = "You can technically form a combo or scrape by, but you drew multiple redundancies, bricks, or zero defensive cards.";
  } else if (score >= 35) {
    grade = 'D';
    title = "Fragile";
    description = "Highly fragile hand. Either your engine is missing or you are carrying too much brick weight to build a real defensive wall.";
  } else {
    grade = 'F';
    title = "Brick / Complete Fail";
    description = "Unplayable opening hand. Back to the deck coach to patch up those card ratios!";
  }

  return {
    score,
    grade,
    title,
    description,
    reasons
  };
}

// Draws a random opening hand based on the ratios in config
export function drawHand(config: DeckConfig): CardItem[] {
  const S = config.starterCount;
  const HT = config.handtrapCount;
  const BB = config.breakerCount;
  const J = config.jollyCount;
  const G = config.garnetCount;
  const B = config.brickCount;
  const E = config.starterExtendersCount || 0;
  const deckSize = config.deckSize;
  const otherCount = Math.max(0, deckSize - (S + HT + BB + J + G + B));

  // Build the complete deck array with extender info for starters
  const fullDeck: { category: CardCategory; isExtender?: boolean }[] = [];
  for (let i = 0; i < S; i++) {
    fullDeck.push({ category: 'starter', isExtender: i < E });
  }
  for (let i = 0; i < HT; i++) fullDeck.push({ category: 'handtrap' });
  for (let i = 0; i < BB; i++) fullDeck.push({ category: 'breaker' });
  for (let i = 0; i < J; i++) fullDeck.push({ category: 'jolly' });
  for (let i = 0; i < G; i++) fullDeck.push({ category: 'garnet' });
  for (let i = 0; i < B; i++) fullDeck.push({ category: 'brick' });
  for (let i = 0; i < otherCount; i++) fullDeck.push({ category: 'other' });

  // Shuffle and draw
  const handSize = config.handSize;
  const handItems: { category: CardCategory; isExtender?: boolean }[] = [];
  const tempDeck = [...fullDeck];

  for (let i = 0; i < handSize; i++) {
    if (tempDeck.length === 0) break;
    const randIndex = Math.floor(Math.random() * tempDeck.length);
    handItems.push(tempDeck[randIndex]);
    tempDeck.splice(randIndex, 1);
  }

  // Map to detailed CardItem with real names from SAMPLE_CARDS
  return handItems.map((item, index) => {
    const names = SAMPLE_CARDS[item.category] || ["Universal Gear"];
    const name = names[Math.floor(Math.random() * names.length)];
    
    let displayName = "";
    switch (item.category) {
      case 'starter': displayName = item.isExtender ? "Starter (Extender)" : "Starter"; break;
      case 'handtrap': displayName = "Hand Trap"; break;
      case 'breaker': displayName = "Board Breaker"; break;
      case 'jolly': displayName = "Jolly/Flex"; break;
      case 'garnet': displayName = "Hard Garnet"; break;
      case 'brick': displayName = "Soft Brick"; break;
      default: displayName = "Filler Card";
    }

    return {
      id: `${item.category}-${index}-${Math.random()}`,
      category: item.category,
      name,
      displayName,
      isExtender: item.isExtender
    };
  });
}

// Runs 1,000 trials to generate statistical distribution of hand quality grades
export function runBatchSimulation(config: DeckConfig, trials = 1000): BatchSimulationSummary {
  let totalScore = 0;
  const gradeDistribution = {
    'A+': 0,
    'A': 0,
    'B': 0,
    'C': 0,
    'D': 0,
    'F': 0
  };

  for (let t = 0; t < trials; t++) {
    const simulatedCardItems = drawHand(config);
    const evalResult = evaluateHand(simulatedCardItems, config);
    totalScore += evalResult.score;
    gradeDistribution[evalResult.grade]++;
  }

  const averageScore = Math.round(totalScore / trials);
  const brickRate = Number(((gradeDistribution['F'] / trials) * 100).toFixed(1));
  const playableRate = Number((((gradeDistribution['A+'] + gradeDistribution['A'] + gradeDistribution['B']) / trials) * 100).toFixed(1));

  return {
    totalSims: trials,
    averageScore,
    gradeDistribution,
    brickRate,
    playableRate
  };
}
