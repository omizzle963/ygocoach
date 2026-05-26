import React from 'react';
import { DeckConfig } from '../types';
import { Plus, Minus } from 'lucide-react';

interface DeckCompositionProps {
  config: DeckConfig;
  onChange: (newConfig: DeckConfig) => void;
  allocatedCards: number;
}

const STRATEGIES_LIST = [
  "None",
  "Combo",
  "Break My Board",
  "Blind 2nd OTK",
  "Midrange",
  "Control",
  "Stun",
  "Protect the Castle",
  "FTK",
  "Exodia",
  "Beatdown/Aggro",
  "Burn",
  "Self Mill",
  "Mill Opponent",
  "Rogue/Custom"
];

export default function DeckComposition({ config, onChange, allocatedCards }: DeckCompositionProps) {
  const updateField = (field: keyof DeckConfig, val: any) => {
    let nextConfig = { ...config, [field]: val };
    if (field === 'starterCount') {
      const currentExt = config.starterExtendersCount || 0;
      nextConfig.starterExtendersCount = Math.min(val, currentExt);
    }
    onChange(nextConfig);
  };

  const handleNumericChange = (field: keyof DeckConfig, valStr: string) => {
    const val = parseInt(valStr) || 0;
    updateField(field, Math.max(0, val));
  };

  const incrementMinMax = (field: 'minStarter' | 'minHandtrap' | 'minBreaker' | 'maxGarnet' | 'minBrick', delta: number, min: number, max: number) => {
    const current = config[field];
    const updated = Math.max(min, Math.min(max, current + delta));
    updateField(field, updated);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 relative group overflow-hidden">
      {/* Glowing bento corner overlay */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>

      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <h3 className="text-lg font-bold tracking-tight text-white font-display">
          Deck Composition
        </h3>
        <span className="text-[10px] bg-slate-950 border border-slate-800/80 text-indigo-400 px-3 py-1 rounded-lg font-mono font-semibold uppercase tracking-wider">
          Engine Configuration
        </span>
      </div>

      {/* Primary Configuration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Deck Size
          </label>
          <div className="flex items-center justify-between bg-slate-950 border border-slate-805/80 hover:border-slate-700/80 rounded-lg p-1.5 h-12 transition-all">
            <button 
              onClick={() => updateField('deckSize', Math.max(30, config.deckSize - 1))} 
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-900 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Minus size={16} />
            </button>
            <span className="text-sm font-bold font-mono text-white select-none">{config.deckSize}</span>
            <button 
              onClick={() => updateField('deckSize', Math.min(100, config.deckSize + 1))} 
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-900 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Hand Size (Turn)
          </label>
          <div className="flex items-center justify-between bg-slate-950 border border-slate-805/80 hover:border-slate-700/80 rounded-lg p-1.5 h-12 transition-all">
            <button 
              onClick={() => updateField('handSize', Math.max(1, config.handSize - 1))} 
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-900 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Minus size={16} />
            </button>
            <span className="text-sm font-bold font-mono text-white select-none">{config.handSize}</span>
            <button 
              onClick={() => updateField('handSize', Math.min(20, config.handSize + 1))} 
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-900 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Deck Strategy & Deck Name input for Coaching AI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 border border-slate-800/80 rounded-xl">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400">
            Deck Strategy
          </label>
          <select
            value={config.deckStrategy}
            onChange={(e) => updateField('deckStrategy', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 text-xs rounded-lg focus:border-indigo-500 outline-none cursor-pointer"
          >
            {STRATEGIES_LIST.map((strat) => (
              <option key={strat} value={strat}>{strat}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Deck Name (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Snake-Eye Fire King, Purrely, Lab..."
            value={config.deckName}
            onChange={(e) => updateField('deckName', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 text-xs rounded-lg focus:border-indigo-500 outline-none placeholder-slate-600"
          />
        </div>
      </div>

      {/* Dynamic Sub-categories */}
      <div className="space-y-4">

        {/* 1. Starters */}
        <div className="bg-slate-950/30 border-l-4 border-[#4cc9b0] rounded-r-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-sm text-slate-200">Primary Starters</h4>
              <p className="text-[11px] text-slate-400">Required cards to open your basic combo plays.</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-slate-500">Min Target</span>
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md overflow-hidden mt-1">
                  <button onClick={() => incrementMinMax('minStarter', -1, 0, 5)} className="px-2 py-1 hover:bg-slate-800 text-slate-400"><Minus size={12} /></button>
                  <span className="px-3 text-xs font-bold font-mono text-white">{config.minStarter}</span>
                  <button onClick={() => incrementMinMax('minStarter', 1, 0, 5)} className="px-2 py-1 hover:bg-slate-800 text-slate-400"><Plus size={12} /></button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-slate-500">Deck Count</span>
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md overflow-hidden mt-1">
                  <button 
                    onClick={() => updateField('starterCount', Math.max(0, config.starterCount - 1))} 
                    className="px-2 py-1 hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="px-3 text-xs font-bold font-mono text-white select-none">{config.starterCount}</span>
                  <button 
                    onClick={() => updateField('starterCount', Math.min(config.deckSize, config.starterCount + 1))} 
                    className="px-2 py-1 hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={40}
              value={config.starterCount}
              onChange={(e) => updateField('starterCount', parseInt(e.target.value))}
              className="flex-1 accent-[#4cc9b0] bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Sub-slider for extenders acting within starters */}
          <div className="pt-2.5 border-t border-slate-900 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-300">Extenders within Starters</span>
              <p className="text-[10px] text-slate-400">Portion of starters that can extend combos (drawn together, no penalty).</p>
            </div>
            <div className="flex gap-4 items-center self-end sm:self-auto">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
                <button 
                  onClick={() => updateField('starterExtendersCount', Math.max(0, (config.starterExtendersCount || 0) - 1))} 
                  className="px-2 py-1 hover:bg-slate-800 text-slate-400 cursor-pointer text-xs"
                >
                  <Minus size={11} />
                </button>
                <span className="px-3 text-xs font-bold font-mono text-white select-none">{config.starterExtendersCount || 0}</span>
                <button 
                  onClick={() => updateField('starterExtendersCount', Math.min(config.starterCount, (config.starterExtendersCount || 0) + 1))} 
                  className="px-2 py-1 hover:bg-slate-800 text-slate-400 cursor-pointer text-xs"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 pb-1">
            <input
              type="range"
              min={0}
              max={config.starterCount}
              value={config.starterExtendersCount || 0}
              onChange={(e) => updateField('starterExtendersCount', parseInt(e.target.value))}
              className="flex-1 accent-indigo-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* 2. Hand Traps */}
        <div className="bg-slate-950/30 border-l-4 border-[#61afef] rounded-r-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-sm text-slate-200">Hand Traps</h4>
              <p className="text-[11px] text-slate-400">Defensive cards drawn to halt opponent's turns.</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-slate-500">Min Target</span>
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md overflow-hidden mt-1">
                  <button onClick={() => incrementMinMax('minHandtrap', -1, 0, 5)} className="px-2 py-1 hover:bg-slate-800 text-slate-400"><Minus size={12} /></button>
                  <span className="px-3 text-xs font-bold font-mono text-white">{config.minHandtrap}</span>
                  <button onClick={() => incrementMinMax('minHandtrap', 1, 0, 5)} className="px-2 py-1 hover:bg-slate-800 text-slate-400"><Plus size={12} /></button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-slate-500">Deck Count</span>
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md overflow-hidden mt-1">
                  <button 
                    onClick={() => updateField('handtrapCount', Math.max(0, config.handtrapCount - 1))} 
                    className="px-2 py-1 hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="px-3 text-xs font-bold font-mono text-white select-none">{config.handtrapCount}</span>
                  <button 
                    onClick={() => updateField('handtrapCount', Math.min(config.deckSize, config.handtrapCount + 1))} 
                    className="px-2 py-1 hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={40}
              value={config.handtrapCount}
              onChange={(e) => updateField('handtrapCount', parseInt(e.target.value))}
              className="flex-1 accent-[#61afef] bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* 3. Board Breakers */}
        <div className="bg-slate-950/30 border-l-4 border-[#d98f45] rounded-r-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-sm text-slate-200">Board Breakers</h4>
              <p className="text-[11px] text-slate-400">Board clearers / high power Going 2nd options.</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-slate-500">Min Target</span>
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md overflow-hidden mt-1">
                  <button onClick={() => incrementMinMax('minBreaker', -1, 0, 5)} className="px-2 py-1 hover:bg-slate-800 text-slate-400"><Minus size={12} /></button>
                  <span className="px-3 text-xs font-bold font-mono text-white">{config.minBreaker}</span>
                  <button onClick={() => incrementMinMax('minBreaker', 1, 0, 5)} className="px-2 py-1 hover:bg-slate-800 text-slate-400"><Plus size={12} /></button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-slate-500">Deck Count</span>
                <div className="flex items-center bg-slate-905 border border-slate-800 rounded-md overflow-hidden mt-1">
                  <button 
                    onClick={() => updateField('breakerCount', Math.max(0, config.breakerCount - 1))} 
                    className="px-2 py-1 hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="px-3 text-xs font-bold font-mono text-white select-none">{config.breakerCount}</span>
                  <button 
                    onClick={() => updateField('breakerCount', Math.min(config.deckSize, config.breakerCount + 1))} 
                    className="px-2 py-1 hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={40}
              value={config.breakerCount}
              onChange={(e) => updateField('breakerCount', parseInt(e.target.value))}
              className="flex-1 accent-[#d98f45] bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* 4. Jolly Cards */}
        <div className="bg-slate-950/30 border-l-4 border-[#c9a84c] rounded-r-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-sm text-[#c9a84c] flex items-center gap-1.5">
                Versatile Jolly Cards
              </h4>
              <p className="text-[11px] text-slate-400">
                Searchers/Flex cards functioning as:{' '}
                {[
                  (config.jollyActsAsStarter !== false ? 'Starter' : null),
                  (config.jollyActsAsHandtrap ? 'Hand Trap' : null),
                  (config.jollyActsAsBreaker !== false ? 'Board Breaker' : null)
                ].filter(Boolean).join(' or ') || 'None (Filler)'}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-slate-500">Deck Count</span>
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md overflow-hidden mt-1">
                  <button 
                    onClick={() => updateField('jollyCount', Math.max(0, config.jollyCount - 1))} 
                    className="px-2 py-1 hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="px-3 text-xs font-bold font-mono text-white select-none">{config.jollyCount}</span>
                  <button 
                    onClick={() => updateField('jollyCount', Math.min(config.deckSize, config.jollyCount + 1))} 
                    className="px-2 py-1 hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={40}
              value={config.jollyCount}
              onChange={(e) => updateField('jollyCount', parseInt(e.target.value))}
              className="flex-1 accent-[#c9a84c] bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
          
          {/* Acts as checkbox criteria */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-[11px] text-slate-300 border-t border-slate-900 pt-2 mt-1">
            <span className="text-slate-500 font-bold font-mono text-[9.5px] uppercase tracking-wider self-center">Acts as:</span>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
              <input 
                type="checkbox" 
                checked={config.jollyActsAsStarter !== false} 
                onChange={(e) => updateField('jollyActsAsStarter', e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 accent-[#c9a84c] cursor-pointer"
              />
              <span className="font-medium text-slate-300">Starter</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
              <input 
                type="checkbox" 
                checked={!!config.jollyActsAsHandtrap} 
                onChange={(e) => updateField('jollyActsAsHandtrap', e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 accent-[#c9a84c] cursor-pointer"
              />
              <span className="font-medium text-slate-300">Hand Trap</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
              <input 
                type="checkbox" 
                checked={config.jollyActsAsBreaker !== false} 
                onChange={(e) => updateField('jollyActsAsBreaker', e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 accent-[#c9a84c] cursor-pointer"
              />
              <span className="font-medium text-slate-300">Board Breaker</span>
            </label>
          </div>
        </div>

        {/* 5. Hard Garnets */}
        <div className="bg-slate-950/30 border-l-4 border-rose-500 rounded-r-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-sm text-slate-200">Hard Garnets</h4>
              <p className="text-[11px] text-slate-400">Bricks that completely disable engine loops if drawn.</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-slate-500">Max Allowed</span>
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md overflow-hidden mt-1">
                  <button onClick={() => incrementMinMax('maxGarnet', -1, 0, 5)} className="px-2 py-1 hover:bg-slate-800 text-slate-400"><Minus size={12} /></button>
                  <span className="px-3 text-xs font-bold font-mono text-white">{config.maxGarnet}</span>
                  <button onClick={() => incrementMinMax('maxGarnet', 1, 0, 5)} className="px-2 py-1 hover:bg-slate-800 text-slate-400"><Plus size={12} /></button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-slate-500">Deck Count</span>
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md overflow-hidden mt-1">
                  <button 
                    onClick={() => updateField('garnetCount', Math.max(0, config.garnetCount - 1))} 
                    className="px-2 py-1 hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="px-3 text-xs font-bold font-mono text-white select-none">{config.garnetCount}</span>
                  <button 
                    onClick={() => updateField('garnetCount', Math.min(config.deckSize, config.garnetCount + 1))} 
                    className="px-2 py-1 hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={40}
              value={config.garnetCount}
              onChange={(e) => updateField('garnetCount', parseInt(e.target.value))}
              className="flex-1 accent-rose-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* 6. Soft Bricks */}
        <div className="bg-slate-950/30 border-l-4 border-slate-500 rounded-r-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-sm text-slate-200">Engine Reqs / Soft Bricks</h4>
              <p className="text-[11px] text-slate-400">Undesirable opening draws, but doesn't ruin loops directly.</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-slate-500">Min Target</span>
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md overflow-hidden mt-1">
                  <button onClick={() => incrementMinMax('minBrick', -1, 0, 5)} className="px-2 py-1 hover:bg-slate-800 text-slate-400"><Minus size={12} /></button>
                  <span className="px-3 text-xs font-bold font-mono text-white">{config.minBrick}</span>
                  <button onClick={() => incrementMinMax('minBrick', 1, 0, 5)} className="px-2 py-1 hover:bg-slate-800 text-slate-400"><Plus size={12} /></button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase text-slate-500">Deck Count</span>
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md overflow-hidden mt-1">
                  <button 
                    onClick={() => updateField('brickCount', Math.max(0, config.brickCount - 1))} 
                    className="px-2 py-1 hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="px-3 text-xs font-bold font-mono text-white select-none">{config.brickCount}</span>
                  <button 
                    onClick={() => updateField('brickCount', Math.min(config.deckSize, config.brickCount + 1))} 
                    className="px-2 py-1 hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={40}
              value={config.brickCount}
              onChange={(e) => updateField('brickCount', parseInt(e.target.value))}
              className="flex-1 accent-slate-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
