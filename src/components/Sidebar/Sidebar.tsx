import { TrendingUp, Settings2, List, Layout, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Controls } from './Controls';
import { MarketLogs } from './MarketLogs';
import { ConfirmationModal } from '../shared/ConfirmationModal';
import type { MarketAlert, ChartTheme } from '../../types';

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
  selectedMtfTfs: string[];
  setSelectedMtfTfs: (val: string[]) => void;
  levelExpiryDays: number;
  setLevelExpiryDays: (val: number) => void;
  showSweeps: boolean;
  setShowSweeps: (val: boolean) => void;
  showSessions: boolean;
  setShowSessions: (val: boolean) => void;
  showDayDividers: boolean;
  setShowDayDividers: (val: boolean) => void;
  londonColor: string;
  setLondonColor: (val: string) => void;
  nyColor: string;
  setNyColor: (val: string) => void;
  theme: ChartTheme;
  setTheme: (val: ChartTheme) => void;
  alerts: MarketAlert[];
  error: string | null;
  loading: boolean;
}

export function Sidebar(props: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'logs' | 'chart'>('settings');
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const handleResetVisuals = () => {
    setModalConfig({
      isOpen: true,
      title: 'Reset Visuals',
      description: 'Are you sure you want to reset all chart colors and visual highlights to their original professional defaults?',
      onConfirm: () => {
        props.setShowSessions(true);
        props.setShowDayDividers(true);
        props.setLondonColor('#38bdf8');
        props.setNyColor('#22c55e');
        props.setTheme({
          upColor: '#10b981',
          downColor: '#f43f5e',
          backgroundColor: '#000000',
          gridColor: '#0f0f0f',
          textColor: '#71717a',
        });
      },
    });
  };

  const handleResetStrategy = () => {
    setModalConfig({
      isOpen: true,
      title: 'Reset Strategy',
      description: 'This will reset all strategy parameters (Swing Sensitivity, Gap Filters, Multi-Timeframe selection) to their default values.',
      onConfirm: () => {
        props.setSwingLength(5);
        props.setMinFvgRatio(0.1);
        props.setLookbackDays(3);
        props.setLevelExpiryDays(3);
        props.setSweepStart('07:00');
        props.setSweepEnd('22:00');
        props.setFilterSweepsByWindow(true);
        props.setShowMtf(false);
        props.setSelectedMtfTfs(['5m', '15m', '30m', '1h', '4h']);
        props.setStrictMode(false);
        props.setShowSweeps(true);
      },
    });
  };

  return (
    <>
      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        description={modalConfig.description}
      />
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
                selectedMtfTfs={props.selectedMtfTfs}
                setSelectedMtfTfs={props.setSelectedMtfTfs}
                levelExpiryDays={props.levelExpiryDays}
                setLevelExpiryDays={props.setLevelExpiryDays}
                showSweeps={props.showSweeps}
                setShowSweeps={props.setShowSweeps}
                onResetStrategy={handleResetStrategy}
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
              className="p-6 h-full flex flex-col space-y-6"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-zinc-500">
                  <Layout size={14} />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Chart Visuals</h2>
                </div>
                <button
                  onClick={handleResetVisuals}
                  title="Reset to Defaults"
                  className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-all group"
                >
                  <RotateCcw size={12} className="group-active:rotate-[-90deg] transition-transform duration-200" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider cursor-pointer" htmlFor="sessions-toggle-tab">
                    Session Highlights
                  </label>
                  <div 
                    className={`w-8 h-4 rounded-full relative transition-all cursor-pointer ${props.showSessions ? 'bg-zinc-200' : 'bg-zinc-800'}`}
                    onClick={() => props.setShowSessions(!props.showSessions)}
                  >
                    <motion.div 
                      animate={{ x: props.showSessions ? 16 : 2 }}
                      className="absolute top-0.5 w-3 h-3 rounded-full bg-zinc-950"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </div>
                  <input id="sessions-toggle-tab" type="checkbox" checked={props.showSessions} onChange={(e) => props.setShowSessions(e.target.checked)} className="hidden" />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider cursor-pointer" htmlFor="day-dividers-toggle-tab">
                    Day Dividers
                  </label>
                  <div 
                    className={`w-8 h-4 rounded-full relative transition-all cursor-pointer ${props.showDayDividers ? 'bg-zinc-200' : 'bg-zinc-800'}`}
                    onClick={() => props.setShowDayDividers(!props.showDayDividers)}
                  >
                    <motion.div 
                      animate={{ x: props.showDayDividers ? 16 : 2 }}
                      className="absolute top-0.5 w-3 h-3 rounded-full bg-zinc-950"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </div>
                  <input id="day-dividers-toggle-tab" type="checkbox" checked={props.showDayDividers} onChange={(e) => props.setShowDayDividers(e.target.checked)} className="hidden" />
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-zinc-900">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Chart Colors</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Bullish Candle</span>
                    <input 
                      type="color" 
                      value={props.theme.upColor} 
                      onChange={(e) => props.setTheme({ ...props.theme, upColor: e.target.value })}
                      className="w-6 h-6 rounded-md bg-transparent border-none cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Bearish Candle</span>
                    <input 
                      type="color" 
                      value={props.theme.downColor} 
                      onChange={(e) => props.setTheme({ ...props.theme, downColor: e.target.value })}
                      className="w-6 h-6 rounded-md bg-transparent border-none cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Background</span>
                    <input 
                      type="color" 
                      value={props.theme.backgroundColor} 
                      onChange={(e) => props.setTheme({ ...props.theme, backgroundColor: e.target.value })}
                      className="w-6 h-6 rounded-md bg-transparent border-none cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Grid Lines</span>
                    <input 
                      type="color" 
                      value={props.theme.gridColor} 
                      onChange={(e) => props.setTheme({ ...props.theme, gridColor: e.target.value })}
                      className="w-6 h-6 rounded-md bg-transparent border-none cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Text / UI</span>
                    <input 
                      type="color" 
                      value={props.theme.textColor} 
                      onChange={(e) => props.setTheme({ ...props.theme, textColor: e.target.value })}
                      className="w-6 h-6 rounded-md bg-transparent border-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-zinc-900">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Session Colors</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">London</span>
                    <input 
                      type="color" 
                      value={props.londonColor} 
                      onChange={(e) => props.setLondonColor(e.target.value)}
                      className="w-6 h-6 rounded-md bg-transparent border-none cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">New York</span>
                    <input 
                      type="color" 
                      value={props.nyColor} 
                      onChange={(e) => props.setNyColor(e.target.value)}
                      className="w-6 h-6 rounded-md bg-transparent border-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-900">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Display Settings</h3>
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">Customize how the chart and session overlays are rendered.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  </>
);
}
