import React, { useState } from 'react';
import { CardItem, DeckConfig, HandEvaluation, BatchSimulationSummary } from '../types';
import { drawHand, evaluateHand, runBatchSimulation } from '../utils/math';
import { PlayCircle, ShieldAlert, Sparkles, Swords, Zap, RefreshCw, Layers, TrendingUp, HelpCircle, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HandPlaytesterProps {
  config: DeckConfig;
}

export default function HandPlaytester({ config }: HandPlaytesterProps) {
  const [hand, setHand] = useState<CardItem[] | null>(null);
  const [evaluation, setEvaluation] = useState<HandEvaluation | null>(null);
  const [batchSummary, setBatchSummary] = useState<BatchSimulationSummary | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Draw one opening hand
  const handleDrawHand = () => {
    const drawn = drawHand(config);
    setHand(drawn);
    const ev = evaluateHand(drawn, config);
    setEvaluation(ev);
    // Unset batch summary to focus on this drawn hand, but don't force it
  };

  // Run 1,000 hand trials
  const handleRunBatchSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const summary = runBatchSimulation(config, 1000);
      setBatchSummary(summary);
      setIsSimulating(false);
    }, 450); // slight delay to feel like the simulator is churning numbers
  };

  // Visual Helper for category colors & icons
  const getCategoryStyles = (category: CardItem['category']) => {
    switch (category) {
      case 'starter':
        return {
          bg: 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-900/40 text-emerald-300 border-emerald-500/30',
          accent: 'emerald',
          icon: <Swords size={18} className="text-emerald-400" />
        };
      case 'handtrap':
        return {
          bg: 'bg-blue-950/40 border-blue-500/40 hover:border-blue-400',
          text: 'text-blue-400',
          badgeBg: 'bg-blue-900/40 text-blue-300 border-blue-500/30',
          accent: 'blue',
          icon: <Zap size={18} className="text-blue-400" />
        };
      case 'breaker':
        return {
          bg: 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-900/40 text-amber-300 border-amber-500/30',
          accent: 'amber',
          icon: <Flame size={18} className="text-amber-400 animate-pulse" />
        };
      case 'jolly':
        return {
          bg: 'bg-yellow-950/40 border-yellow-500/40 hover:border-yellow-400',
          text: 'text-yellow-400',
          badgeBg: 'bg-yellow-900/40 text-yellow-300 border-yellow-500/30',
          accent: 'yellow',
          icon: <Sparkles size={18} className="text-yellow-400" />
        };
      case 'garnet':
        return {
          bg: 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400',
          text: 'text-rose-450',
          badgeBg: 'bg-rose-900/40 text-rose-300 border-rose-500/30',
          accent: 'rose',
          icon: <ShieldAlert size={18} className="text-rose-400 animate-bounce" />
        };
      case 'brick':
        return {
          bg: 'bg-slate-850/40 border-slate-500/40 hover:border-slate-400',
          text: 'text-slate-350',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
          accent: 'slate',
          icon: <AlertTriangle size={18} className="text-slate-500" />
        };
      default:
        return {
          bg: 'bg-slate-900/20 border-slate-800 hover:border-slate-700',
          text: 'text-slate-400',
          badgeBg: 'bg-slate-950 text-slate-500 border-slate-900',
          accent: 'slate',
          icon: <HelpCircle size={18} className="text-slate-600" />
        };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 relative group overflow-hidden">
      {/* Glowing card corner overlay */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-white font-display flex items-center gap-2">
            <Layers size={20} className="text-indigo-400" />
            Opening Hand Playtester
          </h3>
          <p className="text-xs text-slate-400 mt-1">Playtest random draws instantly or run 1,000-hand quality simulations.</p>
        </div>

        <div className="flex gap-2">
          {/* Draw Button */}
          <button
            onClick={handleDrawHand}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all cursor-pointer active:scale-95 duration-150"
          >
            <PlayCircle size={14} />
            Draw 1 Hand
          </button>

          {/* Simulate Button */}
          <button
            onClick={handleRunBatchSimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSimulating ? <RefreshCw size={14} className="animate-spin text-indigo-400" /> : <TrendingUp size={14} className="text-indigo-400" />}
            Batch 1,000 Sims
          </button>
        </div>
      </div>

      {(!hand && !batchSummary && !isSimulating) && (
        <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-xl space-y-3">
          <p className="text-xs text-slate-500 leading-normal">No active draw. Click "Draw 1 Hand" above to playtest or "Batch 1,000 Sims" to evaluate consistency.</p>
        </div>
      )}

      {/* Simulator Loader */}
      {isSimulating && (
        <div className="text-center py-14 space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 w-full h-full border-4 border-slate-800 rounded-full" />
            <div className="absolute inset-0 w-full h-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#f59e0b] animate-pulse">Shuffling & Compiling Trails...</p>
            <p className="text-[10px] text-slate-500 font-mono">Simulating 1,000 randomized draws on current deck ratios</p>
          </div>
        </div>
      )}

      {/* Interactive Hand Section */}
      {hand && evaluation && !isSimulating && (
        <div className="space-y-6">
          
          {/* Drawn Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-3">
            <AnimatePresence mode="popLayout">
              {hand.map((card, idx) => {
                const styles = getCategoryStyles(card.category);
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.8, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className={`border rounded-xl p-4 flex flex-col justify-between h-40 ${styles.bg} transition-all duration-200 select-none shadow-md`}
                  >
                    {/* Card Top */}
                    <div className="flex justify-between items-start gap-1">
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${styles.badgeBg}`}>
                        {card.displayName}
                      </span>
                      {styles.icon}
                    </div>

                    {/* Card Body */}
                    <div className="space-y-1 mt-auto">
                      <h5 className="font-extrabold text-sm text-white line-clamp-2 tracking-tight group-hover:text-amber-300">
                        {card.name}
                      </h5>
                      <span className="text-[8px] uppercase tracking-widest text-slate-400 block mt-1 font-mono">
                        Slot {idx + 1}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Performance Report & Grade Output */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/50 border border-slate-850 p-5 rounded-2xl relative overflow-hidden">
            
            {/* Score Ring */}
            <div className="flex items-center justify-center flex-col space-y-3 p-2 relative">
              <div className="relative w-28 h-28 flex items-center justify-center">
                
                {/* SVG circular track */}
                <svg className="w-full h-full transform -rotate-95">
                  <circle
                    cx="56"
                    cy="56"
                    r="44"
                    stroke="#1e293b"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="44"
                    stroke={evaluation.score >= 70 ? '#10b981' : evaluation.score >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="276"
                    strokeDashoffset={276 - (276 * evaluation.score) / 100}
                    className="transition-all duration-550 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white font-mono">{evaluation.score}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Score</span>
                </div>
              </div>

              <div className="text-center space-y-1">
                <div className="text-xs uppercase tracking-widest font-extrabold text-[#c9a84c]">
                  Grade {evaluation.grade}
                </div>
                <h4 className="font-bold text-sm text-white">{evaluation.title}</h4>
              </div>
            </div>

            {/* Explanations & Reasons */}
            <div className="md:col-span-2 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#4cc9b0]">
                  Hand Evaluation & Breakdown
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans mt-1">
                  {evaluation.description}
                </p>
              </div>

              {/* Specific scoring triggers */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-500">Triggers Evaluated:</div>
                <ul className="space-y-1">
                  {evaluation.reasons.map((r, i) => (
                    <li key={i} className="text-[11px] text-slate-400 bg-slate-900/50 px-2.5 py-1.5 rounded-lg border border-slate-850/60 leading-normal flex items-start gap-1.5">
                      <span className="text-teal-400 font-bold font-mono">✓</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 1,000 Trials Batch Statistics Section */}
      {batchSummary && !isSimulating && (
        <div className="space-y-6 pt-2">
          <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#4cc9b0] mb-4">
              Trial Distribution Data (1,000 Hands Simulated)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Stats highlights */}
              <div className="space-y-4 flex flex-col justify-center">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Average Hand Score</div>
                  <div className="text-4xl font-extrabold text-white font-mono">{batchSummary.averageScore}<span className="text-xs text-slate-500 font-normal"> / 100</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-xl text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Playable%</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono">{batchSummary.playableRate}%</span>
                  </div>
                  <div className="bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-xl text-center">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Brick%</span>
                    <span className="text-xl font-bold text-rose-450 font-mono">{batchSummary.brickRate}%</span>
                  </div>
                </div>
              </div>

              {/* Horizontal Grade distribution bar charts (Custom React/SVG) */}
              <div className="md:col-span-2 space-y-3">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Grade Frequencies</div>
                <div className="space-y-2">
                  {Object.entries(batchSummary.gradeDistribution).map(([grade, count]) => {
                    const pct = Number(((count / batchSummary.totalSims) * 100).toFixed(1));
                    
                    // Grade custom accent colors
                    let barColor = 'bg-slate-600';
                    let textAccent = 'text-slate-450';
                    if (grade === 'A+' || grade === 'A') {
                      barColor = 'bg-emerald-500';
                      textAccent = 'text-emerald-400';
                    } else if (grade === 'B') {
                      barColor = 'bg-teal-500';
                      textAccent = 'text-teal-400';
                    } else if (grade === 'C') {
                      barColor = 'bg-yellow-500';
                      textAccent = 'text-yellow-450';
                    } else if (grade === 'D') {
                      barColor = 'bg-orange-500';
                      textAccent = 'text-orange-400';
                    } else if (grade === 'F') {
                      barColor = 'bg-rose-500';
                      textAccent = 'text-rose-400';
                    }

                    return (
                      <div key={grade} className="flex items-center gap-3">
                        <span className={`w-6 text-xs font-bold ${textAccent} font-mono`}>{grade}</span>
                        <div className="flex-1 bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-850">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-[11px] font-mono text-slate-400">{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Inline fallback icon for Brick
function AlertTriangle({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
