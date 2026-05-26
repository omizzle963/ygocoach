import React, { useState } from 'react';
import { DeckConfig, SimulationResult } from '../types';
import { BrainCircuit, Loader2, Sparkles, AlertTriangle, BookOpen, ChevronRight, Award } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DeckCoachAIProps {
  config: DeckConfig;
  results: SimulationResult;
}

const REASSURING_LOADING_MESSAGES = [
  "Analyzing card slot allocation metrics...",
  "Running multi-variable combinatorics checks...",
  "Consulting strategy blueprints & theory...",
  "Evaluating deck resiliency under Hand Trap pressures...",
  "Drafting competitive card ratio recommendations...",
  "Synthesizing customized deck building advice..."
];

export default function DeckCoachAI({ config, results }: DeckCoachAIProps) {
  const [coachingFeedback, setCoachingFeedback] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const handleConsultCoach = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setCoachingFeedback("");

    // Cycle through loading messages
    let msgInterval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % REASSURING_LOADING_MESSAGES.length);
    }, 2500);

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          overallProbability: results.overallProbability,
          indHandtrapProb: results.indHandtrapProb,
          indBreakerProb: results.indBreakerProb,
          indBrickProb: results.indBrickProb,
          indGarnetProb: results.indGarnetProb,
        }),
      });

      if (!response.ok) {
        throw new Error(`Coaching request failed with status code ${response.status}`);
      }

      const data = await response.json();
      if (data.coaching) {
        setCoachingFeedback(data.coaching);
      } else if (data.error) {
        setErrorMsg(data.error);
      } else {
        setErrorMsg("Failed to retrieve coaching advice. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Unable to reach the AI Deck Coach. Check that GEMINI_API_KEY is configured in Settings > Secrets.");
    } finally {
      clearInterval(msgInterval);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 relative group overflow-hidden">
      {/* Absolute glow overlay */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
      
      {/* Header and Strategy Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-white font-display flex items-center gap-2">
            <BrainCircuit size={20} className="text-indigo-400" />
            AI Deck Building Coach
          </h3>
          <p className="text-xs text-slate-400 mt-1">Get master-class mathematical and deck advice specific to your strategy.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Strategy:</span>
          <span className="text-xs text-indigo-450 font-extrabold">{config.deckStrategy}</span>
        </div>
      </div>

      {/* Main interface trigger */}
      {!isLoading && !coachingFeedback && !errorMsg && (
        <div className="text-center py-10 space-y-5 bg-indigo-950/10 border border-indigo-500/20 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
          
          <div className="relative w-16 h-16 mx-auto bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center text-indigo-400">
            <Sparkles size={24} className="animate-pulse" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h4 className="font-extrabold text-white text-sm uppercase tracking-wide font-display">Generate Strategic Coach Report</h4>
            <p className="text-xs text-slate-300 leading-normal font-sans">
              Our advanced AI Deck Coach reads your exact mathematical combination configurations (your {config.starterCount} starters, {config.handtrapCount} handtraps, etc.) along with your selected Strategy (<span className="text-indigo-400 font-bold">{config.deckStrategy}</span>){config.deckName ? ` for your deck "${config.deckName}"` : ""} to build a personalized master strategy.
            </p>
          </div>

          <button
            onClick={handleConsultCoach}
            className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:bg-indigo-500 transition-all cursor-pointer active:scale-95"
          >
            Consult AI Deck Coach
          </button>
        </div>
      )}

      {/* Loading Screen */}
      {isLoading && (
        <div className="py-14 text-center space-y-5 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-20 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto" />
          
          <div className="space-y-1.5 max-w-sm mx-auto">
            <div className="text-xs text-slate-400 font-mono italic animate-pulse">
              {REASSURING_LOADING_MESSAGES[loadingMsgIdx]}
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Running mathematical reasoning parameters...</p>
          </div>
        </div>
      )}

      {/* Error Output */}
      {errorMsg && (
        <div className="bg-rose-950/20 border border-rose-900/60 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Coach Consultation Error</span>
          </div>
          <p className="text-xs text-slate-300 leading-normal">
            {errorMsg}
          </p>
          <button
            onClick={handleConsultCoach}
            className="text-[10px] font-bold text-indigo-400 hover:underline uppercase tracking-wider block"
          >
            Retry Consultation
          </button>
        </div>
      )}

      {/* Standard Markdown Report Output from Gemini */}
      {coachingFeedback && !isLoading && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4 relative overflow-hidden">
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Live Report</span>
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            </div>

            <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed space-y-3 font-sans">
              <ReactMarkdown>{coachingFeedback}</ReactMarkdown>
            </div>
          </div>

          {/* Draw another check trigger */}
          <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-indigo-300 font-semibold uppercase flex items-center gap-1.5 font-mono">
              <BookOpen size={14} className="text-indigo-400" />
              Need an updated report?
            </span>
            <button
              onClick={handleConsultCoach}
              className="text-xs font-bold text-indigo-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
            >
              Recalculate AI Advice <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
