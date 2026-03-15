import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChartHeaderProps {
  sweepStart: string;
  sweepEnd: string;
  timeframe: string;
  setTimeframe: (tf: string) => void;
}

export function ChartHeader({ sweepStart, sweepEnd, timeframe, setTimeframe }: ChartHeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-md flex items-center px-8 justify-between z-10">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
            <BarChart3 className="text-indigo-400" size={20} />
          </div>
          <div>
            <h2 className="font-black text-xl tracking-tight text-white uppercase">XAUUSD</h2>
            <div className="flex items-center mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Market Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-slate-900/50 p-1 rounded-xl border border-slate-800/50 ml-4">
          {['1m', '3m', '5m', '15m', '30m', '1h', '4h'].map(tf => (
            <motion.button
              key={tf}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                timeframe === tf 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tf}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-4 bg-slate-900/50 px-4 py-1.5 rounded-full border border-slate-800/50 shadow-inner">
        <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-400">
          <span className="text-slate-600 font-mono">WINDOW:</span>
          <span className="text-indigo-400 font-mono tracking-tighter uppercase">{sweepStart} — {sweepEnd}</span>
        </div>
      </div>
    </header>
  );
}
