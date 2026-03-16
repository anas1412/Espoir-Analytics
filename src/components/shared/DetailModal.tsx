import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import type { MarketAlert } from '../../types';

interface DetailModalProps {
  alert: MarketAlert | null;
  isOpen: boolean;
  onClose: () => void;
}

function getTypeColor(type: string) {
  switch (type) {
    case 'ITH':
      return 'text-rose-400';
    case 'ITL':
      return 'text-emerald-400';
    case 'SWEEP':
      return 'text-amber-400';
    case 'CONFIRMATION':
      return 'text-emerald-400';
    case 'CASCADING':
      return 'text-zinc-400';
    case 'INVALID':
    case 'VIOLATED':
      return 'text-zinc-500';
    case 'STOP_HUNT':
      return 'text-amber-400';
    default:
      return 'text-emerald-400';
  }
}

export function DetailModal({ alert, isOpen, onClose }: DetailModalProps) {
  if (!alert) return null;

  const isITH = alert.type === 'ITH';
  const isITL = alert.type === 'ITL';

  return (
    <AnimatePresence>
      {isOpen && alert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-3">
                  {isITH || isITL ? (
                    isITH ? <TrendingDown size={20} className="text-rose-400" /> : <TrendingUp size={20} className="text-emerald-400" />
                  ) : null}
                  <div>
                    <h3 className={`text-base font-bold uppercase tracking-tight ${getTypeColor(alert.type)}`}>
                      {alert.subtype || alert.type}
                    </h3>
                    {alert.timeframe && (
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">{alert.timeframe} Timeframe</p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Price</p>
                  <p className="text-white font-mono text-xl font-bold">${alert.price}</p>
                </div>

                <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                  <div className="flex items-center space-x-2">
                    <Clock size={12} className="text-zinc-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Time</p>
                  </div>
                  <p className="text-white font-mono text-sm font-bold mt-1">{alert.time}</p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-800">
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
