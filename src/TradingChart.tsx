import { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChartHeader } from './components/Chart/ChartHeader';
import { ChartArea } from './components/Chart/ChartArea';
import { LoadingOverlay } from './components/shared/LoadingOverlay';
import { useMarketData } from './hooks/useMarketData';
import type { MarketAlert } from './types';

export function TradingChart() {
  const [timeframe, setTimeframe] = useState('15m');
  const [swingLength, setSwingLength] = useState(5);
  const [lookbackDays, setLookbackDays] = useState(3);
  const [sweepStart, setSweepStart] = useState('07:00');
  const [sweepEnd, setSweepEnd] = useState('22:00');
  const [showMtf, setShowMtf] = useState(false);
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);

  const { data, loading, error } = useMarketData({ timeframe, swingLength, showMtf });

  const handleAlertsUpdate = useCallback((newAlerts: MarketAlert[]) => {
    setAlerts(newAlerts);
  }, []);

  return (
    <div className="flex h-screen bg-[#0b0e14] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden">
      <Sidebar 
        swingLength={swingLength} setSwingLength={setSwingLength}
        lookbackDays={lookbackDays} setLookbackDays={setLookbackDays}
        sweepStart={sweepStart} setSweepStart={setSweepStart}
        sweepEnd={sweepEnd} setSweepEnd={setSweepEnd}
        showMtf={showMtf} setShowMtf={setShowMtf}
        alerts={alerts}
        error={error}
        loading={loading}
      />

      <div className="flex-1 flex flex-col relative bg-[#0b0e14]">
        <ChartHeader 
          sweepStart={sweepStart} 
          sweepEnd={sweepEnd} 
          timeframe={timeframe} 
          setTimeframe={setTimeframe} 
        />

        <div className="flex-1 relative overflow-hidden">
          <LoadingOverlay isLoading={loading} />
          <ChartArea 
            data={data}
            lookbackDays={lookbackDays}
            sweepStart={sweepStart}
            sweepEnd={sweepEnd}
            onAlertsUpdate={handleAlertsUpdate}
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
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      ` }} />
    </div>
  );
}
