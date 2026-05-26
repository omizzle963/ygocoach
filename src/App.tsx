import React, { useState, useMemo } from 'react';
import DeckComposition from './components/DeckComposition';
import StatisticalViability from './components/StatisticalViability';
import HandPlaytester from './components/HandPlaytester';
import DeckCoachAI from './components/DeckCoachAI';
import { DeckConfig, SimulationResult } from './types';
import { calculateExactProbability, probAtLeastOne, probAtLeastX, calculateComboOpeningOdds, generateAdvice } from './utils/math';
import { BookOpen, Calculator, Sparkles, Swords } from 'lucide-react';

const INITIAL_CONFIG: DeckConfig = {
  deckSize: 40,
  handSize: 5,
  starterCount: 12,
  starterExtendersCount: 6,
  minStarter: 1,
  handtrapCount: 9,
  minHandtrap: 0,
  breakerCount: 0,
  minBreaker: 0,
  jollyCount: 3,
  jollyActsAsStarter: true,
  jollyActsAsHandtrap: false,
  jollyActsAsBreaker: true,
  garnetCount: 1,
maxGarnet: 0,
  brickCount: 2,
  minBrick: 0,
  deckStrategy: "None",
  deckName: ""
};

export default function App() {
  const [config, setConfig] = useState<DeckConfig>(INITIAL_CONFIG);
  const [activeTab, setActiveTab] = useState<'optimizer' | 'playtester' | 'coach'>('optimizer');

  // Compute stats reactively based on card values
  const results = useMemo<SimulationResult>(() => {
    const allocated =
      config.starterCount +
      config.handtrapCount +
      config.breakerCount +
      config.jollyCount +
      config.garnetCount +
      config.brickCount;

    if (allocated > config.deckSize) {
      return {
        overallProbability: 0,
        comboOpeningOdds: 0,
        handQualityScore: 0,
        indHandtrapProb: 0,
        indBreakerProb: 0,
        indBrickProb: 0,
        indGarnetProb: 0,
        diminishingReturns: [],
        advice: "ALLOCATION ERROR: Card totals exceed Deck Size.",
        statusColor: "#ef4444"
      };
    }

    const overallProb = calculateExactProbability(config.deckSize, config.handSize, config);

    // Independent checks
    const indHT = probAtLeastOne(config.deckSize, config.handSize, config.handtrapCount + (config.jollyActsAsHandtrap ? config.jollyCount : 0));
    const indBB = probAtLeastOne(config.deckSize, config.handSize, config.breakerCount + (config.jollyActsAsBreaker ? config.jollyCount : 0));
    const indBrick = probAtLeastOne(config.deckSize, config.handSize, config.brickCount);
    const indGarnet = probAtLeastOne(config.deckSize, config.handSize, config.garnetCount);

    // Target starter/combo opener odds (at least minStarter starters/jollies drawn AND at most maxGarnet garnets drawn)
    const comboOpeningOdds = calculateComboOpeningOdds(config.deckSize, config.handSize, config);

    // Dynamic, reactive hand quality score based on combo success, interactions, and brick/garnet mitigation
    const rawQuality = (overallProb * 0.60) + (indHT * 0.20) + ((100 - indBrick) * 0.12) + ((100 - indGarnet) * 0.08);
    const handQualityScore = Math.max(0, Math.min(100, rawQuality));

    // Build the diminishing returns curve data (1 to 20 starters)
    const diminishingData = Array.from({ length: 20 }, (_, idx) => {
      const testerCount = idx + 1;
      const simConfig = { ...config, starterCount: testerCount };
      const simulatedAllocation =
        testerCount +
        config.handtrapCount +
        config.breakerCount +
        config.jollyCount +
        config.garnetCount +
        config.brickCount;
      
      const virtualDeckSize = Math.max(config.deckSize, simulatedAllocation);
      const prob = calculateExactProbability(virtualDeckSize, config.handSize, simConfig);
      return { starters: testerCount, probability: prob };
    });

    const advice = generateAdvice(overallProb, config);

    // Dynamic color coding based on target consistency thresholds
    let statusColor = "#e06c75"; // Red
    if (overallProb >= 80) {
      statusColor = "#c9a84c"; // Gold
    } else if (overallProb >= 60) {
      statusColor = "#4cc9b0"; // Teal
    } else if (overallProb >= 40) {
      statusColor = "#61afef"; // Blue
    }

    return {
      overallProbability: overallProb,
      comboOpeningOdds,
      handQualityScore,
      indHandtrapProb: indHT,
      indBreakerProb: indBB,
      indBrickProb: indBrick,
      indGarnetProb: indGarnet,
      diminishingReturns: diminishingData,
      advice,
      statusColor
    };
  }, [config]);

  const allocatedCards =
    config.starterCount +
    config.handtrapCount +
    config.breakerCount +
    config.jollyCount +
    config.garnetCount +
    config.brickCount;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Cinematic Header Block */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white font-display">
            YGO DeckBuilder <span className="text-indigo-500 underline decoration-2 underline-offset-4">Coach AI</span>
          </h1>
          <p className="text-[#888899] text-xs mt-1 uppercase font-mono tracking-widest flex items-center flex-wrap gap-x-2">
            <span>Strategy:</span>
            <span className="text-slate-200 font-bold italic">{config.deckStrategy}</span>
            {config.deckName && (
              <>
                <span className="text-slate-700">|</span>
                <span className="text-indigo-400 font-semibold lowercase tracking-normal font-sans text-[11px] bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/40">
                  {config.deckName}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Tab selector inside header for a true Bento style topbar tab row */}
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl gap-1 self-start md:self-auto">
          {/* Tab 1: Calculator */}
          <button
            onClick={() => setActiveTab('optimizer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'optimizer'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-[#888899] hover:text-white'
            }`}
          >
            <Calculator size={13} />
            Optimizer
          </button>

          {/* Tab 2: Playtester */}
          <button
            onClick={() => setActiveTab('playtester')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'playtester'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-[#888899] hover:text-white'
            }`}
          >
            <Swords size={13} />
            Playtester
          </button>

          {/* Tab 3: Coach Advice */}
          <button
            onClick={() => setActiveTab('coach')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'coach'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-[#888899] hover:text-white'
            }`}
          >
            <BookOpen size={13} />
            Coach
          </button>
        </div>
      </header>

      {/* Main Tab Render Container */}
      <main className="transition-all duration-300">
        {activeTab === 'optimizer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <DeckComposition
              config={config}
              onChange={setConfig}
              allocatedCards={allocatedCards}
            />
            <StatisticalViability
              results={results}
              allocatedCards={allocatedCards}
              totalCards={config.deckSize}
              config={config}
            />
          </div>
        )}

        {activeTab === 'playtester' && (
          <div className="space-y-6">
            <HandPlaytester config={config} />
          </div>
        )}

        {activeTab === 'coach' && (
          <div className="space-y-6">
            <DeckCoachAI config={config} results={results} />
          </div>
        )}
      </main>

      {/* Footer System Margin Cleaner */}
      <footer className="pt-10 pb-4 text-center border-t border-slate-900">
        <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
          Master Engine ✦ Powered by Multivariate Hypergeometric &amp; Gemini AI
        </p>
      </footer>

    </div>
  );
}