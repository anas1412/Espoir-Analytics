import { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChartHeader } from './components/Chart/ChartHeader';
import { ChartArea } from './components/Chart/ChartArea';
import { LoadingOverlay } from './components/shared/LoadingOverlay';
import { useMarketData } from './hooks/useMarketData';
import type { MarketAlert, ChartTheme } from './types';

const SETTINGS_KEY = 'espoir_analytics_settings';

export function TradingChart() {
  // Load initial settings from localStorage
  const loadInitialSettings = () => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load settings', e);
    }
    return null;
  };

  const initialSettings = loadInitialSettings();

  const [timeframe, setTimeframe] = useState(initialSettings?.timeframe || '15m');
  const [swingLength, setSwingLength] = useState(initialSettings?.swingLength ?? 5);
  const [lookbackDays, setLookbackDays] = useState(initialSettings?.lookbackDays ?? 3);
  const [sweepStart, setSweepStart] = useState(initialSettings?.sweepStart || '07:00');
  const [sweepEnd, setSweepEnd] = useState(initialSettings?.sweepEnd || '22:00');
  const [filterSweepsByWindow, setFilterSweepsByWindow] = useState(initialSettings?.filterSweepsByWindow ?? true);
  const [showMtf, setShowMtf] = useState(initialSettings?.showMtf ?? false);
  const [strictMode, setStrictMode] = useState(initialSettings?.strictMode ?? false);
  const [minFvgRatio, setMinFvgRatio] = useState(initialSettings?.minFvgRatio ?? 0.1);
  const [levelExpiryDays, setLevelExpiryDays] = useState(initialSettings?.levelExpiryDays ?? 3);
  const [showSweeps, setShowSweeps] = useState(initialSettings?.showSweeps ?? true);
  const [showSessions, setShowSessions] = useState(initialSettings?.showSessions ?? true);
  const [showDayDividers, setShowDayDividers] = useState(initialSettings?.showDayDividers ?? true);
  const [londonColor, setLondonColor] = useState(initialSettings?.londonColor || '#38bdf8');
  const [nyColor, setNyColor] = useState(initialSettings?.nyColor || '#22c55e');
  const [sessionOpacity, setSessionOpacity] = useState(initialSettings?.sessionOpacity ?? 0.08);
  const [selectedMtfTfs, setSelectedMtfTfs] = useState<string[]>(initialSettings?.selectedMtfTfs || ['5m', '15m', '30m', '1h', '4h']);
  const [selectedThemeKey, setSelectedThemeKey] = useState(initialSettings?.selectedThemeKey || 'default');
  
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [resetCounter, setResetCounter] = useState(0);
  const [theme, setTheme] = useState<ChartTheme>(initialSettings?.theme || {
    upColor: '#10b981',
    downColor: '#f43f5e',
    backgroundColor: '#000000',
    gridColor: '#0f0f0f',
    textColor: '#71717a',
    wickColor: '#71717a',
    borderColor: '#71717a',
  });

  const saveTimeoutRef = useRef<any>(null);

  // Smart Debounced Auto-Save
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      const settings = {
        timeframe, swingLength, lookbackDays, sweepStart, sweepEnd,
        filterSweepsByWindow, showMtf, strictMode, minFvgRatio,
        levelExpiryDays, showSweeps, showSessions, showDayDividers,
        londonColor, nyColor, sessionOpacity, selectedMtfTfs,
        selectedThemeKey, theme
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      console.log('[Dashboard] Settings auto-saved');
    }, 1000); // 1s debounce for stability

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [
    timeframe, swingLength, lookbackDays, sweepStart, sweepEnd,
    filterSweepsByWindow, showMtf, strictMode, minFvgRatio,
    levelExpiryDays, showSweeps, showSessions, showDayDividers,
    londonColor, nyColor, sessionOpacity, selectedMtfTfs,
    selectedThemeKey, theme
  ]);

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
        sessionOpacity={sessionOpacity} setSessionOpacity={setSessionOpacity}
        theme={theme} setTheme={setTheme}
        selectedThemeKey={selectedThemeKey} setSelectedThemeKey={setSelectedThemeKey}
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
            sessionOpacity={sessionOpacity}
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
