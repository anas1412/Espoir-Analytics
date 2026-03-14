import { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode, type ISeriesApi, type SeriesMarker, type Time, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts';
import { Activity, Bell, Clock } from 'lucide-react';

interface Candle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ITH_ITL {
  index: number;
  type: 1 | -1;
  level: number;
}

interface Sweep {
  index: number;
  type: 1 | -1;
  level: number;
  sourceIndex: number;
}

export function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersPluginRef = useRef<any>(null);

  const [data, setData] = useState<{ohlc: Candle[], ith_itl: ITH_ITL[], sweeps: Sweep[]}>({ ohlc: [], ith_itl: [], sweeps: [] });
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('15m');
  const [swingLength, setSwingLength] = useState(5);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    console.log(`Fetching: timeframe=${timeframe}, swingLength=${swingLength}`);
    fetch(`${apiUrl}/api/gold?timeframe=${timeframe}&range=30d&swingLength=${swingLength}`)
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          setError(res.error);
          setData({ ohlc: [], ith_itl: [] });
        } else {
          setData(res);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError('Failed to fetch data from backend. Ensure server is running.');
        setLoading(false);
      });
  }, [timeframe, swingLength]);

  useEffect(() => {
    if (!chartContainerRef.current || !data.ohlc || data.ohlc.length === 0) return;

    if (!chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: '#0b0e14' },
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: { color: '#1f2937' },
          horzLines: { color: '#1f2937' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });
      chartRef.current = chart;

      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });
      seriesRef.current = series;
      markersPluginRef.current = createSeriesMarkers(series);
    }

    const ohlc = data.ohlc || [];
    if (ohlc.length === 0) return;
    seriesRef.current?.setData(ohlc as any);

    // Apply Markers for ITH and ITL
    const markers: SeriesMarker<Time>[] = [];
    const newAlerts: any[] = [];
    const signals = data.ith_itl || [];
    
    signals.forEach((signal) => {
      const candle = ohlc[signal.index];
      if (!candle) return;

      const isITH = signal.type === 1;
      
      // Basic London to NY timezone filter (07:00 to 22:00 UTC)
      const date = new Date((candle.time as number) * 1000);
      const hours = date.getUTCHours();
      const inSession = hours >= 7 && hours <= 22;

      // Filter for current day if not showing all history
      const isToday = new Date().getUTCDate() === date.getUTCDate() && 
                      new Date().getUTCMonth() === date.getUTCMonth();
      
      const shouldShow = showAllHistory || (inSession && isToday);

      if (shouldShow) {
        markers.push({
          time: candle.time,
          position: isITH ? 'aboveBar' : 'belowBar',
          color: isITH ? '#ef5350' : '#26a69a',
          shape: isITH ? 'arrowDown' : 'arrowUp',
          text: isITH ? 'ITH' : 'ITL',
          size: 2,
        });

        newAlerts.push({
          id: `${candle.time}-${isITH ? 'ITH' : 'ITL'}`,
          time: date.toLocaleString(),
          type: isITH ? 'ITH' : 'ITL',
          price: signal.level.toFixed(2),
          isToday,
          inSession
        });
      }
    });

    // Add Sweep markers
    const sweeps = data.sweeps || [];
    sweeps.forEach((sweep) => {
      const candle = ohlc[sweep.index];
      if (!candle) return;

      const isITH_Sweep = sweep.type === 1; // Swept a High
      const date = new Date((candle.time as number) * 1000);
      const hours = date.getUTCHours();
      const inSession = hours >= 7 && hours <= 22;
      const isToday = new Date().getUTCDate() === date.getUTCDate() && 
                      new Date().getUTCMonth() === date.getUTCMonth();
      
      const shouldShow = showAllHistory || (inSession && isToday);

      if (shouldShow) {
        markers.push({
          time: candle.time,
          position: isITH_Sweep ? 'aboveBar' : 'belowBar',
          color: '#fbbf24', // Amber/Yellow for sweeps
          shape: 'circle',
          text: 'SWEEP',
          size: 1,
        });

        newAlerts.push({
          id: `${candle.time}-SWEEP`,
          time: date.toLocaleString(),
          type: 'SWEEP',
          price: sweep.level.toFixed(2),
          isToday,
          inSession,
          subtype: isITH_Sweep ? 'ITH Sweep' : 'ITL Sweep'
        });
      }
    });

    markersPluginRef.current?.setMarkers(markers.sort((a, b) => (a.time as number) - (b.time as number)));
    setAlerts(newAlerts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())); 

    chartRef.current.timeScale().fitContent();
    
    // Resize observer
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data]);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Sidebar / Alerts */}
      <div className="w-80 bg-gray-950 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Activity size={20} />
            <h1 className="font-bold text-lg tracking-wide">SMC Radar</h1>
          </div>
        </div>

        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Controls</h2>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Timeframe</label>
              <div className="grid grid-cols-4 gap-1">
                {['1m', '3m', '5m', '15m', '30m', '1h', '4h'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`py-1 rounded text-[11px] font-medium transition-colors ${
                      timeframe === tf ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 block mb-1 flex justify-between">
                <span>Swing Length</span>
                <span className="text-indigo-400 font-mono">{swingLength}</span>
              </label>
              <input 
                type="range" 
                min="3" 
                max="50" 
                value={swingLength}
                onChange={(e) => setSwingLength(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[11px] text-gray-400 cursor-pointer" htmlFor="history-toggle">
                Show Full History
              </label>
              <input 
                id="history-toggle"
                type="checkbox"
                checked={showAllHistory}
                onChange={(e) => setShowAllHistory(e.target.checked)}
                className="w-4 h-4 rounded border-gray-800 bg-gray-900 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                <Bell size={14} className="mr-1" /> Auto Logs
              </h2>
              <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">{alerts.length} signals</span>
            </div>

            <div className="space-y-3">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-xs flex items-start">
                  <Activity size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold mb-1">Backend Error</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}
              
              {alerts.length === 0 && !loading && !error && (
                <div className="text-sm text-gray-500 text-center py-8">
                  No signals found in London/NY session for this timeframe.
                </div>
              )}
              {alerts.map(alert => (
                <div key={alert.id} className={`border p-3 rounded-lg shadow-sm transition-colors ${
                  alert.type === 'SWEEP' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-gray-900 border-gray-800'
                }`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      alert.type === 'ITH' ? 'bg-red-500/10 text-red-400' : 
                      alert.type === 'ITL' ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {alert.subtype || alert.type} Detected
                    </span>
                    <span className="text-gray-400 font-mono text-sm">${alert.price}</span>
                  </div>
                  <div className="flex items-center text-gray-500 text-xs mt-2 font-mono">
                    <Clock size={12} className="mr-1" />
                    {alert.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="h-14 border-b border-gray-800 bg-gray-950 flex items-center px-6 justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="font-bold text-xl">XAUUSD</h2>
            <span className="text-gray-500 text-sm flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Live Market Data
            </span>
          </div>
          <div className="text-sm text-gray-400">
            London / NY Session Filter Active
          </div>
        </div>

        <div className="flex-1 bg-[#0b0e14] relative">
          {loading && (
            <div className="absolute inset-0 z-10 bg-[#0b0e14]/80 flex items-center justify-center">
              <div className="flex flex-col items-center text-indigo-400">
                <Activity className="animate-spin mb-4" size={32} />
                <span className="font-medium tracking-widest uppercase text-sm">Analyzing Market...</span>
              </div>
            </div>
          )}
          <div ref={chartContainerRef} className="absolute inset-0" />
        </div>
      </div>
    </div>
  );
}