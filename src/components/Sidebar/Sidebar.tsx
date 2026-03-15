import { TrendingUp, Settings2, List, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Controls } from './Controls';
import { MarketLogs } from './MarketLogs';
import type { MarketAlert } from '../../types';

interface SidebarProps {
  swingLength: number;
  setSwingLength: (val: number) => void;
  lookbackDays: number;
  setLookbackDays: (val: number) => void;
  sweepStart: string;
  setSweepStart: (val: string) => void;
  sweepEnd: string;
  setSweepEnd: (val: string) => void;
  filterSweepsByWindow: boolean;
  setFilterSweepsByWindow: (val: boolean) => void;
  showMtf: boolean;
  setShowMtf: (val: boolean) => void;
  strictMode: boolean;
  setStrictMode: (val: boolean) => void;
  minFvgRatio: number;
  setMinFvgRatio: (val: number) => void;
  alerts: MarketAlert[];
  error: string | null;
  loading: boolean;
}

export function Sidebar(props: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'logs' | 'chart'>('settings');

  return (
    <motion.div 
      initial={{ x: -380 }}
      animate={{ x: 0 }}
      transition={{ type: 'tween', duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="w-[380px] bg-black/60 backdrop-blur-2xl border-r border-zinc-900 flex flex-col z-20 shadow-xl"
    >
      <div className="p-6 border-b border-zinc-900">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-zinc-900 rounded-md border border-zinc-800 shadow-[0_0_15px_rgba(255,255,255,0.02)]">
            <TrendingUp size={18} className="text-zinc-100" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white leading-none">ITT Analytics</h1>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1.5">Trading Dashboard</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-zinc-900/50 p-1 rounded-md border border-zinc-800 relative">
          {(['settings', 'logs', 'chart'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 relative flex items-center justify-center space-x-2 py-2 rounded-md text-xs font-bold transition-colors z-10"
              style={{ color: activeTab === tab ? '#ffffff' : '#71717a' }}
            >
              <span className="relative z-20 flex items-center space-x-2">
                {tab === 'settings' && <Settings2 size={14} />}
                {tab === 'logs' && <List size={14} />}
                {tab === 'chart' && <Layout size={14} />}
                <span className="capitalize">{tab === 'settings' ? 'Setup' : tab}</span>
              </span>
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-zinc-800 rounded-md shadow-sm border border-zinc-700"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar relative">
        <AnimatePresence mode="wait">
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <Controls 
                swingLength={props.swingLength}
                setSwingLength={props.setSwingLength}
                lookbackDays={props.lookbackDays}
                setLookbackDays={props.setLookbackDays}
                sweepStart={props.sweepStart}
                setSweepStart={props.setSweepStart}
                sweepEnd={props.sweepEnd}
                setSweepEnd={props.setSweepEnd}
                filterSweepsByWindow={props.filterSweepsByWindow}
                setFilterSweepsByWindow={props.setFilterSweepsByWindow}
                showMtf={props.showMtf}
                setShowMtf={props.setShowMtf}
                strictMode={props.strictMode}
                setStrictMode={props.setStrictMode}
                minFvgRatio={props.minFvgRatio}
                setMinFvgRatio={props.setMinFvgRatio}
              />
            </motion.div>
          )}
          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <MarketLogs 
                alerts={props.alerts} 
                error={props.error} 
                loading={props.loading} 
              />
            </motion.div>
          )}
          {activeTab === 'chart' && (
            <motion.div
              key="chart"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="p-6 h-full flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                <Layout className="text-zinc-600" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Chart Settings</h3>
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">Visual customization and theme controls coming soon.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
