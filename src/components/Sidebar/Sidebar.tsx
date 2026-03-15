import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Controls } from './Controls';
import { MarketLogs } from './MarketLogs';
import type { MarketAlert } from '../../types';

interface SidebarProps {
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
  alerts: MarketAlert[];
  error: string | null;
  loading: boolean;
  showMtf: boolean;
  setShowMtf: (val: boolean) => void;
}

export function Sidebar(props: SidebarProps) {
  return (
    <motion.div 
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="w-85 bg-slate-950 border-r border-slate-800 flex flex-col z-20 shadow-2xl"
    >
      <div className="p-5 border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-xl">
        <div className="flex items-center space-x-3 text-indigo-400 group">
          <div className="p-2 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
            <TrendingUp size={24} className="group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-white leading-none">ITT</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">Intermediate Term Trading</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-5 space-y-8">
          <Controls 
            timeframe={props.timeframe}
            setTimeframe={props.setTimeframe}
            swingLength={props.swingLength}
            setSwingLength={props.setSwingLength}
            lookbackDays={props.lookbackDays}
            setLookbackDays={props.setLookbackDays}
            sweepStart={props.sweepStart}
            setSweepStart={props.setSweepStart}
            sweepEnd={props.sweepEnd}
            setSweepEnd={props.setSweepEnd}
            showMtf={props.showMtf}
            setShowMtf={props.setShowMtf}
          />
          <MarketLogs 
            alerts={props.alerts} 
            error={props.error} 
            loading={props.loading} 
          />
        </div>
      </div>
    </motion.div>
  );
}
