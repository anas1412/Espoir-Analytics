import { Bell, Activity, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MarketAlert } from '../../types';

interface MarketLogsProps {
  alerts: MarketAlert[];
  error: string | null;
  loading: boolean;
}

export function MarketLogs({ alerts, error, loading }: MarketLogsProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2 text-slate-400">
          <Bell size={14} />
          <h2 className="text-[11px] font-bold uppercase tracking-widest">Market Logs</h2>
        </div>
        <span className="text-[10px] font-mono bg-slate-800/80 px-2 py-0.5 rounded-full text-slate-400 border border-slate-700/50">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-2.5 relative">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 text-xs flex items-start space-x-3"
          >
            <Activity size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-black uppercase tracking-wider mb-1">System Error</p>
              <p className="text-red-400/80 leading-relaxed">{error}</p>
            </div>
          </motion.div>
        )}
        
        {alerts.length === 0 && !loading && !error && (
          <div className="text-xs text-slate-500 text-center py-12 px-6 border-2 border-dashed border-slate-800/50 rounded-3xl italic">
            Scanning horizons... No signals in defined parameters.
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <AnimatePresence initial={false}>
            {alerts.map((alert) => (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                layout
                whileHover={{ scale: 1.02, x: 4 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`group relative overflow-hidden p-4 rounded-2xl border transition-all cursor-default ${
                  alert.type === 'SWEEP' 
                    ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 shadow-lg shadow-amber-500/5' 
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    alert.type === 'ITH' ? 'bg-red-500/10 text-red-400' : 
                    alert.type === 'ITL' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {alert.subtype || alert.type}
                  </span>
                  <span className="text-slate-200 font-mono text-xs font-bold tabular-nums">
                    ${alert.price}
                  </span>
                </div>
                <div className="flex items-center text-slate-500 text-[10px] font-medium tracking-tight">
                  <Clock size={10} className="mr-1.5 opacity-60" />
                  {alert.time}
                </div>
                {alert.type === 'SWEEP' && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 blur-2xl rounded-full -mr-8 -mt-8 pointer-events-none group-hover:bg-amber-500/20 transition-colors" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
