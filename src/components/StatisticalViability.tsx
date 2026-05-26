import React from 'react';
import { SimulationResult, DeckConfig, CardItem, HandEvaluation, BatchSimulationSummary } from '../types';
import { 
  ShieldCheck, 
  Flame, 
  Ban, 
  AlertTriangle, 
  BarChart4, 
  Dices, 
  RotateCw, 
  Swords, 
  Zap, 
  Sparkles, 
  HelpCircle 
} from 'lucide-react';
import { 
  probAtLeastOne, 
  calculateExactProbability, 
  calculateComboOpeningOdds, 
  drawHand, 
  evaluateHand,
  runBatchSimulation
} from '../utils/math';

interface StatisticalViabilityProps {
  results: SimulationResult;
  allocatedCards: number;
  totalCards: number;
  config: DeckConfig;
}

export default function StatisticalViability({ results, allocatedCards, totalCards, config }: StatisticalViabilityProps) {
  const isError = allocatedCards > totalCards;

  const [subTab, setSubTab] = React.useState<'stats' | 'hands'>('stats');
  const [localHand, setLocalHand] = React.useState<CardItem[] | null>(null);
  const [localEvaluation, setLocalEvaluation] = React.useState<HandEvaluation | null>(null);
  const [localBatchSummary, setLocalBatchSummary] = React.useState<BatchSimulationSummary | null>(null);
  const [isSimulating, setIsSimulating] = React.useState<boolean>(false);

  const handleDrawLocalHand = React.useCallback(() => {
    if (isError) return;
    const drawn = drawHand(config);
    setLocalHand(drawn);
    const ev = evaluateHand(drawn, config);
    setLocalEvaluation(ev);
  }, [config, isError]);

  const handleRunLocalBatchSim = React.useCallback(() => {
    if (isError) return;
    setIsSimulating(true);
    setTimeout(() => {
      const summary = runBatchSimulation(config, 1000);
      setLocalBatchSummary(summary);
      setIsSimulating(false);
    }, 450);
  }, [config, isError]);

  // Synchronize drawn/evaluation hand on slider changes or subTab change
  React.useEffect(() => {
    if (subTab === 'hands') {
      setLocalBatchSummary(null);
      if (!isError) {
        handleDrawLocalHand();
      }
    }
  }, [config, subTab, isError, handleDrawLocalHand]);

  // Custom SVG path calculation for the line chart
  const points = results.diminishingReturns;
  const paddingX = 40;
  const paddingY = 20;
  const chartWidth = 400;
  const chartHeight = 150;

  const getCoordinates = () => {
    if (points.length === 0) return '';
    return points.map((p, index) => {
      // x ranges from 1 to 20
      const x = paddingX + ((p.starters - 1) / 19) * (chartWidth - paddingX * 2);
      // y ranges from 0 to 100 prob
      const y = chartHeight - paddingY - (p.probability / 100) * (chartHeight - paddingY * 2);
      return `${x},${y}`;
    }).join(' ');
  };

  const polylinePoints = getCoordinates();

  // Create an inherent baseline config to evaluate the deck's direct content rather than user's target filters
  const inherentConfig: DeckConfig = {
    ...config,
    minStarter: 1,
    minHandtrap: 0,
    minBreaker: 0,
    maxGarnet: 0,
    minBrick: 0,
  };

  const inherentComboOdds = calculateComboOpeningOdds(config.deckSize, config.handSize, inherentConfig);
  const inherentOverallProb = calculateExactProbability(config.deckSize, config.handSize, inherentConfig);

  const indHT = probAtLeastOne(config.deckSize, config.handSize, config.handtrapCount + (config.jollyActsAsHandtrap ? config.jollyCount : 0));
  const indBrick = probAtLeastOne(config.deckSize, config.handSize, config.brickCount);
  const indGarnet = probAtLeastOne(config.deckSize, config.handSize, config.garnetCount);

  const rawQuality = (inherentOverallProb * 0.60) + (indHT * 0.20) + ((100 - indBrick) * 0.12) + ((100 - indGarnet) * 0.08);
  const inherentHandQualityScore = Math.max(0, Math.min(100, rawQuality));

  // 1. Target Combo Consistency (weights 35 max)
  const comboScore = Math.min(35, (inherentComboOdds / 100) * 35);

  // 2. Hand Quality Score (weights 25 max)
  const qualityScore = Math.min(25, (inherentHandQualityScore / 100) * 25);

  // 3. Going 2nd Disruption (interactive power) (weights 20 max)
  const isJollyGoing2nd = config.jollyActsAsHandtrap || config.jollyActsAsBreaker !== false;
  const totalNonEngine = (config.handtrapCount || 0) + (config.breakerCount || 0) + (isJollyGoing2nd ? (config.jollyCount || 0) : 0);
  const nonEngineProb = probAtLeastOne(config.deckSize, config.handSize, totalNonEngine);
  const going2ndScore = Math.min(20, (nonEngineProb / 100) * 20);

  // 4. Deck Size Efficiency (YGO community standard rules: 40 is optimal, penalize bloat)
  const deckSizePenalty = Math.max(0, Math.abs(config.deckSize - 40) * 0.4);
  const deckSizeScore = Math.max(0, 10 - deckSizePenalty);

  // 5. Bricks & Garnet penalties
  const brickPenalty = indBrick * 0.08;
  const garnetPenalty = indGarnet * 0.12;

  // Aggregated raw score: maps directly to rating
  const rawScore = comboScore + qualityScore + going2ndScore + deckSizeScore - brickPenalty - garnetPenalty;

  // Star Rating (0 - 5 stars)
  const starValue = isError 
    ? 0 
    : Math.max(0.5, Math.min(5, Math.round((rawScore / 18) * 2) / 2));

  // Helper to render the 5 stars
  const renderStars = (rating: number) => {
    const starsArray = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        starsArray.push(
          <svg key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      } else if (rating >= i - 0.5) {
        starsArray.push(
          <div key={i} className="relative w-5 h-5">
            <svg className="absolute top-0 left-0 w-5 h-5 text-slate-700 fill-slate-700" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <div className="absolute top-0 left-0 w-[50%] overflow-hidden h-full">
              <svg className="w-5 h-5 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
          </div>
        );
      } else {
        starsArray.push(
          <svg key={i} className="w-5 h-5 text-slate-700 fill-none stroke-slate-600 stroke-[1.5]" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      }
    }
    return starsArray;
  };

  const getRatingLabel = (stars: number): string => {
    if (stars >= 5.0) return "Championship Winner";
    if (stars >= 4.5) return "Highly Optimized Competitor";
    if (stars >= 4.0) return "Consistent Competitive Grade";
    if (stars >= 3.5) return "Solid Rogue Tier";
    if (stars >= 3.0) return "Decent Rogue Build";
    if (stars >= 2.5) return "Casual Rogue Grade";
    if (stars >= 2.0) return "Unbalanced / Friction Tier";
    if (stars >= 1.5) return "High Brick Risk";
    if (stars >= 1.0) return "Extremely Bloated / Slow";
    return "Inherent Combo Brick";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between relative group overflow-hidden">
      {/* Absolute background glowing node */}
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Chess.com style Top Navigation Header */}
      <div className="flex border-b border-slate-800 bg-slate-950/30 -mx-6 -mt-6 mb-5 rounded-t-2xl overflow-hidden z-10">
        <button
          onClick={() => setSubTab('stats')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border-b-2 ${
            subTab === 'stats'
              ? 'bg-slate-900/40 text-indigo-400 border-b-indigo-500 shadow-md'
              : 'text-slate-400 hover:text-white border-b-transparent hover:bg-slate-950/10'
          }`}
        >
          <BarChart4 size={14} className="text-indigo-400" />
          <span>Analysis</span>
        </button>
        <button
          onClick={() => setSubTab('hands')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border-b-2 ${
            subTab === 'hands'
              ? 'bg-slate-900/40 text-amber-400 border-b-amber-500 shadow-md'
              : 'text-slate-400 hover:text-white border-b-transparent hover:bg-slate-950/10'
          }`}
        >
          <Dices size={14} className="text-amber-400" />
          <span>Opening Hands</span>
        </button>
      </div>

      {subTab === 'stats' ? (
        <div className="space-y-6 flex-1 flex flex-col justify-between z-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold tracking-tight text-white font-display">
                Statistical Viability
              </h3>
              <span className={`text-[10px] px-3 py-1 rounded-lg font-mono font-bold uppercase tracking-wider ${
                isError ? 'bg-red-950 border border-red-500/30 text-red-400 animate-pulse' : 'bg-slate-950 border border-slate-800/80 text-indigo-400'
              }`}>
                Deck Slots: {allocatedCards} / {totalCards}
              </span>
            </div>

            {/* Bento-Style Circle Gauge Display */}
            <div className="grid grid-cols-3 gap-2 w-full text-center items-center py-6 bg-slate-950/40 border border-slate-800/50 rounded-2xl relative overflow-hidden px-2 sm:px-4">
              <div className="absolute inset-x-0 top-0 h-20 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none" />
              
              {/* Column 1: Left - Target Combo Opening Odds */}
              <div className="flex flex-col items-center justify-center space-y-3 z-10">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold max-w-[100px] leading-tight select-none">
                  Target Combo Opening Odds
                </span>
                <div className="relative flex items-center justify-center">
                  <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90">
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="26" 
                      stroke="#1e293b" 
                      strokeWidth="5" 
                      fill="transparent" 
                      className="sm:hidden"
                    />
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="34" 
                      stroke="#1e293b" 
                      strokeWidth="5" 
                      fill="transparent" 
                      className="hidden sm:block"
                    />
                    
                    {/* Responsive dynamic filling */}
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="26" 
                      stroke={isError ? '#ef4444' : '#4cc9b0'} 
                      strokeWidth="5" 
                      strokeDasharray="163.4"
                      strokeDashoffset={isError ? 163.4 : 163.4 - (results.comboOpeningOdds / 100) * 163.4}
                      strokeLinecap="round"
                      fill="transparent" 
                      className="transition-all duration-1000 ease-out sm:hidden"
                    />
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="34" 
                      stroke={isError ? '#ef4444' : '#4cc9b0'} 
                      strokeWidth="5" 
                      strokeDasharray="213.6"
                      strokeDashoffset={isError ? 213.6 : 213.6 - (results.comboOpeningOdds / 100) * 213.6}
                      strokeLinecap="round"
                      fill="transparent" 
                      className="transition-all duration-1000 ease-out hidden sm:block"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xs sm:text-sm font-black text-white font-mono">
                      {isError ? 'ERR' : `${results.comboOpeningOdds.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 2: Center - Probability Calculator (Main) */}
              <div className="flex flex-col items-center justify-center space-y-3 z-10 scale-105">
                <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-extrabold max-w-[124px] leading-tight select-none">
                  Probability Calculator
                </span>
                <div className="relative flex items-center justify-center">
                  <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90">
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      stroke="#1e293b" 
                      strokeWidth="7" 
                      fill="transparent" 
                      className="sm:hidden"
                    />
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="54" 
                      stroke="#1e293b" 
                      strokeWidth="8" 
                      fill="transparent" 
                      className="hidden sm:block"
                    />
                    
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      stroke={isError ? '#ef4444' : results.statusColor} 
                      strokeWidth="7" 
                      strokeDasharray="251.3"
                      strokeDashoffset={isError ? 251.3 : 251.3 - (results.overallProbability / 100) * 251.3}
                      strokeLinecap="round"
                      fill="transparent" 
                      className="transition-all duration-1000 ease-out sm:hidden"
                    />
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="54" 
                      stroke={isError ? '#ef4444' : results.statusColor} 
                      strokeWidth="8" 
                      strokeDasharray="339.3"
                      strokeDashoffset={isError ? 339.3 : 339.3 - (results.overallProbability / 100) * 339.3}
                      strokeLinecap="round"
                      fill="transparent" 
                      className="transition-all duration-1000 ease-out hidden sm:block"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-sm sm:text-2xl font-black text-white font-display">
                      {isError ? 'ERR' : `${results.overallProbability.toFixed(1)}`}
                      {!isError && <span className="text-[10px] sm:text-[14px] text-indigo-400 font-normal font-sans ml-0.5">%</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 3: Right - Hand Quality Score */}
              <div className="flex flex-col items-center justify-center space-y-3 z-10">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold max-w-[100px] leading-tight select-none">
                  Hand Quality Score
                </span>
                <div className="relative flex items-center justify-center">
                  <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90">
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="26" 
                      stroke="#1e293b" 
                      strokeWidth="5" 
                      fill="transparent" 
                      className="sm:hidden"
                    />
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="34" 
                      stroke="#1e293b" 
                      strokeWidth="5" 
                      fill="transparent" 
                      className="hidden sm:block"
                    />
                    
                    {/* Responsive dynamic filling */}
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="26" 
                      stroke={isError ? '#ef4444' : '#6366f1'} 
                      strokeWidth="5" 
                      strokeDasharray="163.4"
                      strokeDashoffset={isError ? 163.4 : 163.4 - (results.handQualityScore / 100) * 163.4}
                      strokeLinecap="round"
                      fill="transparent" 
                      className="transition-all duration-1000 ease-out sm:hidden"
                    />
                    <circle 
                      cx="40" 
                      cy="40" 
                      r="34" 
                      stroke={isError ? '#ef4444' : '#6366f1'} 
                      strokeWidth="5" 
                      strokeDasharray="213.6"
                      strokeDashoffset={isError ? 213.6 : 213.6 - (results.handQualityScore / 100) * 213.6}
                      strokeLinecap="round"
                      fill="transparent" 
                      className="transition-all duration-1000 ease-out hidden sm:block"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xs sm:text-sm font-black text-white font-mono">
                      {isError ? 'ERR' : `${results.handQualityScore.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Independent Metric Sub-Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* HT card */}
              <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-3 text-center space-y-1 hover:border-slate-700 transition-colors">
                <div className="flex justify-center text-[#61afef] mb-1">
                  <ShieldCheck size={16} />
                </div>
                <div className="text-base font-bold font-mono text-white">{results.indHandtrapProb.toFixed(1)}%</div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">1+ Hand Trap</div>
              </div>

              {/* Breakers card */}
              <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-3 text-center space-y-1 hover:border-slate-700 transition-colors">
                <div className="flex justify-center text-[#d98f45] mb-1">
                  <Flame size={16} />
                </div>
                <div className="text-base font-bold font-mono text-white">{results.indBreakerProb.toFixed(1)}%</div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">1+ Breaker</div>
              </div>

              {/* Engine Bricks */}
              <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-3 text-center space-y-1 hover:border-slate-700 transition-colors">
                <div className="flex justify-center text-slate-400 mb-1">
                  <Ban size={16} />
                </div>
                <div className="text-base font-bold font-mono text-white">{results.indBrickProb.toFixed(1)}%</div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">1+ Bricks</div>
              </div>

              {/* Garnet Risk */}
              <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-3 text-center space-y-1 hover:border-slate-700 transition-colors">
                <div className="flex justify-center text-rose-400 mb-1">
                  <AlertTriangle size={16} />
                </div>
                <div className="text-base font-bold font-mono text-white">{results.indGarnetProb.toFixed(1)}%</div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Hard Garnet %</div>
              </div>
            </div>
          </div>

          {/* Deck Rating Section */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-[-10px] w-24 h-24 bg-yellow-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="space-y-1 text-center sm:text-left z-10">
              <span className="text-[10px] tracking-widest text-[#a855f7] font-extrabold uppercase font-mono">
                Deck Coach Rating
              </span>
              <h4 className="text-sm font-bold text-slate-100 flex items-center justify-center sm:justify-start gap-1.5 font-display">
                {isError ? 'N/A' : getRatingLabel(starValue)}
              </h4>
              <p className="text-[10px] text-slate-400 max-w-sm font-mono">
                {isError 
                  ? 'Invalid config setup.' 
                  : `Rating Score: ${(Math.max(10, Math.min(100, rawScore * 1.05))).toFixed(0)}/100 • Going 2nd disruption: ${nonEngineProb.toFixed(1)}%`}
              </p>
            </div>

            <div className="flex flex-col items-center gap-1 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-xl min-w-[130px] z-10">
              <div className="flex items-center gap-1">
                {renderStars(starValue)}
              </div>
              <span className="text-[11px] font-mono font-bold text-yellow-400">
                {isError ? '0.0 / 5.0' : `${starValue.toFixed(1)} / 5.0`}
              </span>
            </div>
          </div>

          {/* Advisor text box */}
          <div 
            className="border-l-4 rounded-r-xl p-4 text-xs leading-relaxed transition-all duration-350 bg-slate-950/60 border-slate-800"
            style={{ borderLeftColor: isError ? '#e06c75' : results.statusColor }}
          >
            <p className="text-slate-300 leading-normal italic">
              "{isError ? 'ALLOCATION ERROR: Allocated counts exceed total deck size. Change counts or enlarge total Deck Size.' : results.advice}"
            </p>
          </div>

          {/* Diminishing Returns Chart */}
          {!isError && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 relative overflow-hidden">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                <span>Diminishing Returns: Probability Curve</span>
                <span className="text-[9px] text-indigo-400 font-mono font-semibold lowercase">Based on Starter Count</span>
              </div>
              <div className="relative h-44 w-full">
                <svg 
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                  className="w-full h-full overflow-visible select-none"
                >
                  {/* Grids */}
                  <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.03)" />
                  <line x1={paddingX} y1={(chartHeight) / 2} x2={chartWidth - paddingX} y2={(chartHeight) / 2} stroke="rgba(255,255,255,0.03)" />
                  <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                  
                  {/* Left axis titles */}
                  <text x={paddingX - 10} y={paddingY + 4} textAnchor="end" className="fill-slate-600 font-mono text-[8px]">100%</text>
                  <text x={paddingX - 10} y={(chartHeight) / 2 + 3} textAnchor="end" className="fill-slate-600 font-mono text-[8px]">50%</text>
                  <text x={paddingX - 10} y={chartHeight - paddingY + 3} textAnchor="end" className="fill-slate-600 font-mono text-[8px]">0%</text>
                  
                  {/* Curve area background helper */}
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="absolute top-0 left-0 w-full h-full overflow-visible">
                    {polylinePoints && (
                      <path
                        d={`M ${paddingX},${chartHeight - paddingY} L ${polylinePoints} L ${chartWidth - paddingX},${chartHeight - paddingY} Z`}
                        fill="url(#chartGlow)"
                        opacity="0.15"
                      />
                    )}
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Curve path */}
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2.5"
                    points={polylinePoints}
                    className="drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                  />
                  
                  {/* Draw hover nodes or grid labels */}
                  <text x={paddingX} y={chartHeight - paddingY + 12} textAnchor="middle" className="fill-slate-600 font-mono text-[8.5px]">1</text>
                  <text x={(chartWidth) / 2} y={chartHeight - paddingY + 12} textAnchor="middle" className="fill-slate-500 font-mono text-[8.5px]">10 Starters</text>
                  <text x={chartWidth - paddingX} y={chartHeight - paddingY + 12} textAnchor="middle" className="fill-slate-600 font-mono text-[8.5px]">20</text>
                </svg>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 flex-1 flex flex-col justify-between z-10 animate-fade-in">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-white font-display flex items-center gap-1.5">
                  Opening Hand Simulator
                </h3>
                <p className="text-[11px] text-slate-400">Randomized draw representation based on current deck sliders.</p>
              </div>
              <span className="text-[10px] px-3 py-1 rounded-lg font-mono font-bold uppercase tracking-wider bg-slate-950 border border-slate-850/60 text-amber-500">
                Size: {config.handSize} Cards
              </span>
            </div>

            {isError ? (
              <div className="text-center py-14 border border-dashed border-red-900/40 rounded-2xl bg-red-950/10 space-y-3">
                <AlertTriangle className="mx-auto text-rose-500" size={24} />
                <div className="space-y-1">
                  <p className="text-xs text-red-400 font-extrabold uppercase tracking-wide">Allocation Error Present</p>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto">Allocated count exceeds Deck Size. Modify slider configs on the left panel to execute dry-runs.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <span className="text-[9.5px] font-mono font-bold text-slate-500 uppercase tracking-widest">Simulated Deal</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDrawLocalHand}
                      disabled={isSimulating}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10.5px] font-extrabold uppercase tracking-wider rounded-lg shadow-md hover:shadow-indigo-500/10 active:scale-95 transition-all text-xs cursor-pointer duration-150 disabled:opacity-50"
                    >
                      <RotateCw size={12} className="text-white" />
                      <span>Draw New Hand</span>
                    </button>
                    <button
                      onClick={handleRunLocalBatchSim}
                      disabled={isSimulating}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10.5px] font-extrabold uppercase tracking-wider rounded-lg shadow-md hover:shadow-slate-700/10 active:scale-95 transition-all text-xs cursor-pointer duration-150 disabled:opacity-50"
                    >
                      <BarChart4 size={12} className="text-amber-450" />
                      <span>Batch 1000 Sims</span>
                    </button>
                  </div>
                </div>

                {isSimulating ? (
                  <div className="text-center py-14 space-y-4 bg-slate-950/20 border border-slate-850 rounded-2xl">
                    <div className="relative w-10 h-10 mx-auto">
                      <div className="absolute inset-0 w-full h-full border-4 border-slate-800 rounded-full" />
                      <div className="absolute inset-0 w-full h-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold uppercase tracking-widest text-[#f59e0b] animate-pulse">Running 1,000 Draws...</p>
                      <p className="text-[10px] text-slate-500 font-mono">Shuffling & compiling trials on current slider configs</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Hand cards row using slider labels instead of names */}
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-3">
                      {localHand ? (
                        localHand.map((card, idx) => {
                          const styles = getCategoryStyles(card.category);
                          const label = getSliderName(card.category);
                          return (
                            <div
                              key={card.id}
                              className={`border rounded-xl p-3 flex flex-col justify-between h-28 ${styles.bg} hover:scale-[1.02] hover:shadow-md transition-all duration-200 select-none shadow-sm relative overflow-hidden`}
                            >
                              <div className="flex justify-between items-start gap-1 z-10">
                                <span className={`text-[7px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded border leading-none tracking-wider ${styles.badgeBg}`}>
                                  Slot {idx + 1}
                                </span>
                                {styles.icon}
                              </div>

                              <div className="space-y-0.5 mt-auto z-10">
                                <h5 className="font-extrabold text-[11px] leading-tight text-white tracking-tight">
                                  {label}
                                </h5>
                                <span className="text-[7.5px] uppercase tracking-widest text-[#cba74d] font-mono font-bold block">
                                  {card.category === 'other' ? 'FILLER' : card.category.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        Array.from({ length: config.handSize }).map((_, idx) => (
                          <div key={idx} className="border border-dashed border-slate-800 rounded-xl h-28 flex items-center justify-center bg-slate-950/20 text-slate-700">
                            <span className="text-[10px] font-mono">Slot {idx + 1}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Hand evaluation breakdown exactly like playtester but contextualized */}
                    {localEvaluation ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/80 border border-slate-850 p-4.5 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-[15px] w-24 h-24 bg-yellow-500/5 rounded-full blur-xl pointer-events-none" />
                        
                        {/* Circle Gauge Indicator */}
                        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-850 pb-3.5 md:pb-0 md:pr-4 text-center">
                          <div className="text-3xl font-black text-white font-mono leading-none tracking-tight">
                            {localEvaluation.score}
                            <span className="text-xs text-slate-600 font-normal ml-0.5">/100</span>
                          </div>
                          <span className="text-[9px] font-mono tracking-widest text-[#cba74d] font-black uppercase mt-1.5">
                            Grade {localEvaluation.grade}
                          </span>
                          <h4 className="font-bold text-xs text-slate-200 mt-1.5 leading-tight">{localEvaluation.title}</h4>
                        </div>

                        {/* Breakdown Reasons */}
                        <div className="md:col-span-2 space-y-3.5 pl-0 md:pl-2 flex flex-col justify-between">
                          <div className="space-y-1">
                            <h4 className="text-[9px] font-black uppercase tracking-wider text-[#4cc9b0] font-mono">
                              Evaluation Feedbacks
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-normal">
                              {localEvaluation.description}
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <div className="text-[8.5px] uppercase font-bold text-slate-500 font-mono">Opening Triggers:</div>
                            <ul className="space-y-1">
                              {localEvaluation.reasons.map((r, i) => (
                                <li key={i} className="text-[10px] text-slate-400 bg-slate-900/60 px-2 py-1 rounded-md border border-slate-850/50 leading-normal flex items-start gap-1.5">
                                  <span className="text-teal-400 font-black font-mono">✓</span>
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-slate-850 rounded-xl text-slate-500 text-[11px]">
                        Evaluation details will appear here once hand is drawn.
                      </div>
                    )}

                    {/* Empirical Sim results report */}
                    {localBatchSummary && (
                      <div className="bg-slate-950/60 border border-slate-850 p-4.5 rounded-2xl space-y-3.5 transition-all duration-300">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-[#cbd5e1] font-mono">
                          1,000 Sim Trials Report
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Left stats */}
                          <div className="flex flex-col justify-center space-y-3 border-b md:border-b-0 md:border-r border-slate-850/80 pb-3 md:pb-0 md:pr-4">
                            <div>
                              <span className="text-[8.5px] uppercase font-mono font-bold text-slate-500">Average Joint Score</span>
                              <div className="text-3xl font-black text-slate-100 font-mono leading-none tracking-tight">
                                {localBatchSummary.averageScore}<span className="text-sm text-slate-500 font-normal"> / 100</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-1.5 rounded-xl text-center">
                                <span className="text-[8px] uppercase font-bold text-slate-400 block mb-0.5">Playable%</span>
                                <span className="text-sm font-bold text-emerald-400 font-mono">{localBatchSummary.playableRate}%</span>
                              </div>
                              <div className="bg-rose-950/20 border border-rose-900/30 px-2.5 py-1.5 rounded-xl text-center">
                                <span className="text-[8px] uppercase font-bold text-slate-400 block mb-0.5">Brick%</span>
                                <span className="text-sm font-bold text-rose-455 font-mono">{localBatchSummary.brickRate}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Grade rates bar charts */}
                          <div className="md:col-span-2 space-y-1.5 pl-0 md:pl-2">
                            <span className="text-[8.5px] uppercase font-mono font-bold text-slate-500">Grade Frequency Distribution</span>
                            <div className="space-y-1.5 pt-0.5">
                              {Object.entries(localBatchSummary.gradeDistribution).map(([grade, count]) => {
                                const pct = Number(((count / localBatchSummary.totalSims) * 100).toFixed(1));
                                
                                let barBg = 'bg-slate-700';
                                let gradeColor = 'text-slate-400';
                                if (grade === 'A+' || grade === 'A') {
                                  barBg = 'bg-emerald-500';
                                  gradeColor = 'text-emerald-400';
                                } else if (grade === 'B') {
                                  barBg = 'bg-teal-500';
                                  gradeColor = 'text-teal-400';
                                } else if (grade === 'C') {
                                  barBg = 'bg-yellow-500';
                                  gradeColor = 'text-yellow-450';
                                } else if (grade === 'D') {
                                  barBg = 'bg-orange-500';
                                  gradeColor = 'text-orange-400';
                                } else if (grade === 'F') {
                                  barBg = 'bg-rose-500';
                                  gradeColor = 'text-rose-400';
                                }

                                return (
                                  <div key={grade} className="flex items-center gap-2">
                                    <span className={`w-5 text-[10px] font-black ${gradeColor} font-mono leading-none`}>{grade}</span>
                                    <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850/65">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-500 ${barBg}`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="w-16 text-right text-[8.5px] font-mono text-slate-500 leading-none">
                                      {count} ({pct}%)
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const getCategoryStyles = (category: string) => {
  switch (category) {
    case 'starter':
      return {
        bg: 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-400',
        text: 'text-emerald-400',
        badgeBg: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30',
        icon: <Swords size={14} className="text-emerald-400" />
      };
    case 'handtrap':
      return {
        bg: 'bg-indigo-950/30 border-indigo-500/30 hover:border-indigo-400',
        text: 'text-indigo-400',
        badgeBg: 'bg-indigo-900/40 text-indigo-300 border-indigo-500/30',
        icon: <Zap size={14} className="text-indigo-400" />
      };
    case 'breaker':
      return {
        bg: 'bg-amber-950/30 border-amber-500/30 hover:border-amber-400',
        text: 'text-amber-400',
        badgeBg: 'bg-amber-900/40 text-amber-300 border-amber-500/30',
        icon: <Flame size={14} className="text-amber-400 animate-pulse" />
      };
    case 'jolly':
      return {
        bg: 'bg-yellow-950/30 border-yellow-500/30 hover:border-yellow-400',
        text: 'text-yellow-450',
        badgeBg: 'bg-yellow-900/40 text-yellow-350 border-yellow-500/30',
        icon: <Sparkles size={14} className="text-yellow-400" />
      };
    case 'garnet':
      return {
        bg: 'bg-rose-950/30 border-rose-500/30 hover:border-rose-400',
        text: 'text-rose-455',
        badgeBg: 'bg-rose-900/40 text-rose-300 border-rose-500/30',
        icon: <AlertTriangle size={14} className="text-rose-400 animate-bounce" />
      };
    case 'brick':
      return {
        bg: 'bg-slate-850/40 border-slate-500/30 hover:border-slate-400',
        text: 'text-slate-350',
        badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
        icon: <Ban size={14} className="text-slate-400" />
      };
    default:
      return {
        bg: 'bg-slate-900/20 border-slate-800 hover:border-slate-700',
        text: 'text-slate-400',
        badgeBg: 'bg-slate-950 text-slate-500 border-slate-900',
        icon: <HelpCircle size={14} className="text-slate-500" />
      };
  }
};

const getSliderName = (category: string) => {
  switch (category) {
    case 'starter': return "Primary Starter";
    case 'handtrap': return "Defensive Hand Trap";
    case 'breaker': return "Board Breaker";
    case 'jolly': return "Versatile Jolly";
    case 'garnet': return "Hard Garnet";
    case 'brick': return "Ordinary Engine Brick";
    default: return "Filler Card";
  }
};
