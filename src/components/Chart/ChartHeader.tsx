import { BarChart3, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChartHeaderProps {
  sweepStart: string;
  sweepEnd: string;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  onReset: () => void;
}

export function ChartHeader({ sweepStart, sweepEnd, timeframe, setTimeframe, onReset }: ChartHeaderProps) {
  return (
    <header className="h-14 border-b border-zinc-900 bg-black/40 backdrop-blur-xl flex items-center px-6 justify-between z-[30] gap-4 relative">
      <div className="flex items-center space-x-8 min-w-0">
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="w-8 h-8 bg-zinc-800 rounded-md flex items-center justify-center border border-zinc-700">
            <BarChart3 className="text-white" size={16} />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight text-white uppercase leading-none">XAUUSD</h2>
            <div className="flex items-center mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Live</span>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-zinc-900/50 p-1 rounded-md border border-zinc-800 overflow-x-auto no-scrollbar relative">
          <div className="flex items-center border-r border-zinc-800/50 pr-1 mr-1">
             <button
               onClick={onReset}
               title="Reset View"
               className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-white transition-all group relative"
             >
               <RotateCcw size={14} className="group-active:rotate-[-90deg] transition-transform duration-200" />
             </button>
          </div>
          
          <div className="flex items-center">
            {['1m', '3m', '5m', '15m', '30m', '1h', '4h'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className="relative px-3 py-1.5 rounded-md text-xs font-semibold transition-colors z-10 flex-shrink-0"
                style={{ color: timeframe === tf ? '#ffffff' : '#71717a' }}
              >
                <span className="relative z-10">{tf}</span>
                {timeframe === tf && (
                  <motion.div
                    layoutId="activeTimeframe"
                    className="absolute inset-0 bg-zinc-800 rounded-md shadow-sm border border-zinc-700 pointer-events-none"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4 bg-zinc-900/40 px-4 py-1.5 rounded-md border border-zinc-800 shadow-inner flex-shrink-0">
        <div className="flex items-center space-x-2 text-[11px] font-bold text-zinc-400">
          <span className="text-zinc-600 font-mono tracking-wider">WINDOW</span>
          <span className="text-zinc-100 font-mono tracking-tighter uppercase">{sweepStart} — {sweepEnd}</span>
        </div>
      </div>
    </header>
  );
}
