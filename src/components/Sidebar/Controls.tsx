import { Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ControlsProps {
  timeframe: string;
  setTimeframe: (tf: string) => void;
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
}

export function Controls({
  timeframe, setTimeframe,
  swingLength, setSwingLength,
  lookbackDays, setLookbackDays,
  sweepStart, setSweepStart,
  sweepEnd, setSweepEnd,
  showMtf, setShowMtf
}: ControlsProps) {
  return (
    <section className="space-y-5">
      <div className="flex items-center space-x-2 text-slate-400 mb-2">
        <Settings2 size={14} />
        <h2 className="text-[11px] font-bold uppercase tracking-widest">Configuration</h2>
      </div>
      
      <div className="space-y-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50">
        <div className="space-y-2">
          <label className="text-[10px] text-slate-500 font-semibold uppercase ml-1">Timeframe</label>
          <div className="grid grid-cols-4 gap-1.5">
            {['1m', '3m', '5m', '15m', '30m', '1h', '4h'].map(tf => (
              <motion.button
                key={tf}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeframe(tf)}
                className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  timeframe === tf 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {tf}
              </motion.button>
            ))}
          </div>
        </div>

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
      </div>
    </section>
  );
}
