import { Settings2 } from 'lucide-react';

interface ControlsProps {
  swingLength: number;
  setSwingLength: (val: number) => void;
  lookbackDays: number;
  setLookbackDays: (val: number) => void;
  sweepStart: string;
  setSweepStart: (val: string) => void;
  sweepEnd: string;
  setSweepEnd: (val: string) => void;
  showMtf: boolean;
  setShowMtf: (val: boolean) => void;
  strictMode: boolean;
  setStrictMode: (val: boolean) => void;
}

export function Controls({
  swingLength, setSwingLength,
  lookbackDays, setLookbackDays,
  sweepStart, setSweepStart,
  sweepEnd, setSweepEnd,
  showMtf, setShowMtf,
  strictMode, setStrictMode
}: ControlsProps) {
  return (
    <section className="space-y-5">
      <div className="flex items-center space-x-2 text-slate-400 mb-2">
        <Settings2 size={14} />
        <h2 className="text-[11px] font-bold uppercase tracking-widest">Configuration</h2>
      </div>
      
      <div className="space-y-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50">
        <div className="space-y-3">
          <div className="flex justify-between items-end px-1">
            <label className="text-[10px] text-slate-500 font-semibold uppercase">Swing Length</label>
            <span className="text-indigo-400 font-mono text-sm font-bold">{swingLength}</span>
          </div>
          <input 
            type="range" 
            min="3" 
            max="50" 
            value={swingLength}
            onChange={(e) => setSwingLength(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] text-slate-500 font-semibold uppercase ml-1">Lookback (Days)</label>
          <input 
            type="number" 
            min="1" 
            max="30" 
            value={lookbackDays}
            onChange={(e) => setLookbackDays(parseInt(e.target.value))}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-semibold uppercase ml-1">Sweep Start</label>
            <input 
              type="time" 
              value={sweepStart}
              onChange={(e) => setSweepStart(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-semibold uppercase ml-1">Sweep End</label>
            <input 
              type="time" 
              value={sweepEnd}
              onChange={(e) => setSweepEnd(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
          <label className="text-[10px] text-slate-500 font-semibold uppercase ml-1 cursor-pointer select-none" htmlFor="mtf-toggle">
            Multi-Timeframe Signals
          </label>
          <input 
            id="mtf-toggle"
            type="checkbox"
            checked={showMtf}
            onChange={(e) => setShowMtf(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700/50 bg-slate-800/50 text-indigo-600 focus:ring-indigo-500/50 transition-all cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 font-semibold uppercase ml-1 cursor-pointer select-none" htmlFor="strict-toggle">
              Strict Mode
            </label>
            <span className="text-[8px] text-slate-600 ml-1 leading-none">
              {strictMode ? 'Strictly inside FVG' : 'Allows piercing (Discretionary)'}
            </span>
          </div>
          <input 
            id="strict-toggle"
            type="checkbox"
            checked={strictMode}
            onChange={(e) => setStrictMode(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700/50 bg-slate-800/50 text-indigo-600 focus:ring-indigo-500/50 transition-all cursor-pointer"
          />
        </div>
      </div>
    </section>
  );
}
