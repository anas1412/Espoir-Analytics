import { Activity, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MarketAlert } from '../../types';

interface MarketLogsProps {
  alerts: MarketAlert[];
  error: string | null;
  loading: boolean;
}

export function MarketLogs({ alerts, error, loading }: MarketLogsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Live Signals</h2>
        <div className="flex items-center space-x-2">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-zinc-600 font-bold uppercase">{alerts.length} found</span>
        </div>
      </div>

      <div className="space-y-3 relative">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 p-4 rounded-md text-white text-xs flex items-start space-x-3 shadow-lg"
          >
            <Activity size={16} className="mt-0.5 flex-shrink-0 text-zinc-500" />
            <div>
              <p className="font-bold uppercase tracking-wider mb-1 text-zinc-400">System Alert</p>
              <p className="text-zinc-500 leading-relaxed font-medium">{error}</p>
            </div>
          </motion.div>
        )}
        
        {alerts.length === 0 && !loading && !error && (
          <div className="text-[11px] text-zinc-600 text-center py-16 px-6 border border-zinc-900 rounded-md bg-zinc-950/30 italic font-medium">
            Waiting for market structures...
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <AnimatePresence initial={false} mode="popLayout">
            {alerts.map((alert) => (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
                className={`group relative overflow-hidden p-4 rounded-md border transition-all cursor-default shadow-sm ${
                  alert.type === 'CONFIRMATION'
                    ? 'bg-emerald-900/20 border-emerald-500/40 hover:border-emerald-500'
                    : alert.type === 'CASCADING'
                    ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                    : alert.type === 'INVALID' || alert.type === 'VIOLATED'
                    ? 'bg-zinc-950/50 border-zinc-900 opacity-60 hover:opacity-100'
                    : alert.type === 'STOP_HUNT'
                    ? 'bg-amber-900/10 border-amber-500/30 hover:border-amber-500'
                    : alert.type === 'SWEEP' 
                    ? 'bg-amber-900/10 border-amber-500/30 hover:border-amber-500' 
                    : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800'
                }`}
              >
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      alert.type === 'CONFIRMATION' ? 'text-emerald-400' :
                      alert.type === 'CASCADING' ? 'text-zinc-400' :
                      alert.type === 'INVALID' || alert.type === 'VIOLATED' ? 'text-zinc-600' :
                      alert.type === 'STOP_HUNT' ? 'text-amber-400' :
                      alert.type === 'SWEEP' ? 'text-amber-400' :
                      alert.type === 'ITH' ? 'text-rose-500' : 
                      'text-emerald-500'
                    }`}>
                      {alert.subtype || alert.type}
                    </span>
                    <div className="flex items-center mt-1 space-x-1.5">
                      <Clock size={10} className="text-zinc-600" />
                      <span className="text-[10px] text-zinc-500 font-bold tabular-nums uppercase">{alert.time.split(',')[1]}</span>
                    </div>
                  </div>
                  <span className="text-white font-mono text-sm font-bold tabular-nums tracking-tight">
                    ${alert.price}
                  </span>
                </div>
                
                {alert.type === 'SWEEP' && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full -mr-12 -mt-12 pointer-events-none group-hover:bg-white/10 transition-colors" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
