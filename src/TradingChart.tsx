import { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChartHeader } from './components/Chart/ChartHeader';
import { ChartArea } from './components/Chart/ChartArea';
import { LoadingOverlay } from './components/shared/LoadingOverlay';
import { useMarketData } from './hooks/useMarketData';
import type { MarketAlert, ChartTheme } from './types';

export function TradingChart() {
  const [timeframe, setTimeframe] = useState('15m');
  const [swingLength, setSwingLength] = useState(5);
  const [lookbackDays, setLookbackDays] = useState(3);
  const [sweepStart, setSweepStart] = useState('07:00');
  const [sweepEnd, setSweepEnd] = useState('22:00');
  const [filterSweepsByWindow, setFilterSweepsByWindow] = useState(true);
  const [showMtf, setShowMtf] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [minFvgRatio, setMinFvgRatio] = useState(0.1);
  const [levelExpiryDays, setLevelExpiryDays] = useState(3);
  const [showSweeps, setShowSweeps] = useState(true);
  const [showSessions, setShowSessions] = useState(true);
  const [showDayDividers, setShowDayDividers] = useState(true);
  const [londonColor, setLondonColor] = useState('#38bdf8');
  const [nyColor, setNyColor] = useState('#22c55e');
  const [selectedMtfTfs, setSelectedMtfTfs] = useState(['5m', '15m', '30m', '1h', '4h']);
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [resetCounter, setResetCounter] = useState(0);
  const [theme, setTheme] = useState<ChartTheme>({
    upColor: '#10b981',
    downColor: '#f43f5e',
    backgroundColor: '#000000',
    gridColor: '#0f0f0f',
    textColor: '#71717a',
  });

  const { data, loading, error } = useMarketData({ 
    timeframe, 
    swingLength, 
    showMtf, 
    strictMode, 
    minFvgRatio,
    selectedMtfTfs,
    showSweeps
  });

  const handleAlertsUpdate = useCallback((newAlerts: MarketAlert[]) => {
    setAlerts(newAlerts);
  }, []);

  return (
    <div className="flex h-screen bg-[#000000] text-zinc-100 font-sans selection:bg-zinc-500/30 overflow-hidden relative">
      {/* Background ambient glow for blur texture */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-900/20 blur-[120px] rounded-full pointer-events-none" />
      
      <Sidebar 
        swingLength={swingLength} setSwingLength={setSwingLength}
        lookbackDays={lookbackDays} setLookbackDays={setLookbackDays}
        sweepStart={sweepStart} setSweepStart={setSweepStart}
        sweepEnd={sweepEnd} setSweepEnd={setSweepEnd}
        filterSweepsByWindow={filterSweepsByWindow} setFilterSweepsByWindow={setFilterSweepsByWindow}
        showMtf={showMtf} setShowMtf={setShowMtf}
        strictMode={strictMode} setStrictMode={setStrictMode}
        minFvgRatio={minFvgRatio} setMinFvgRatio={setMinFvgRatio}
        selectedMtfTfs={selectedMtfTfs} setSelectedMtfTfs={setSelectedMtfTfs}
        levelExpiryDays={levelExpiryDays} setLevelExpiryDays={setLevelExpiryDays}
        showSweeps={showSweeps} setShowSweeps={setShowSweeps}
        showSessions={showSessions} setShowSessions={setShowSessions}
        showDayDividers={showDayDividers} setShowDayDividers={setShowDayDividers}
        londonColor={londonColor} setLondonColor={setLondonColor}
        nyColor={nyColor} setNyColor={setNyColor}
        theme={theme} setTheme={setTheme}
        alerts={alerts}
        error={error}
        loading={loading}
      />

      <div className="flex-1 min-w-0 flex flex-col relative bg-black">
        <ChartHeader 
          sweepStart={sweepStart} 
          sweepEnd={sweepEnd} 
          timeframe={timeframe} 
          setTimeframe={setTimeframe} 
          onReset={() => setResetCounter(c => c + 1)}
        />

        <div className="flex-1 relative overflow-hidden">
          <LoadingOverlay isLoading={loading} />
          <ChartArea 
            data={data}
            timeframe={timeframe}
            lookbackDays={lookbackDays}
            levelExpiryDays={levelExpiryDays}
            sweepStart={sweepStart}
            sweepEnd={sweepEnd}
            filterSweepsByWindow={filterSweepsByWindow}
            onAlertsUpdate={handleAlertsUpdate}
            resetCounter={resetCounter}
            showSessions={showSessions}
            showDayDividers={showDayDividers}
            londonColor={londonColor}
            nyColor={nyColor}
            theme={theme}
          />
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      ` }} />
    </div>
  );
}
