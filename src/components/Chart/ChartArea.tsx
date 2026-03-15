import { useEffect, useRef } from 'react';
import { createChart, CrosshairMode, type ISeriesApi, type SeriesMarker, type Time, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts';
import type { ChartData, MarketAlert } from '../../types';
import { isTimeInWindow } from '../../utils/time';

interface ChartAreaProps {
  data: ChartData;
  lookbackDays: number;
  sweepStart: string;
  sweepEnd: string;
  filterSweepsByWindow: boolean;
  onAlertsUpdate: (alerts: MarketAlert[]) => void;
}

export function ChartArea({ data, lookbackDays, sweepStart, sweepEnd, filterSweepsByWindow, onAlertsUpdate }: ChartAreaProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersPluginRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data.ohlc || data.ohlc.length === 0) return;

    if (!chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: '#0b0e14' },
          textColor: '#94a3b8',
        },
        grid: {
          vertLines: { color: 'rgba(30, 41, 59, 0.5)' },
          horzLines: { color: 'rgba(30, 41, 59, 0.5)' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: '#1e293b',
        },
        rightPriceScale: {
          borderColor: '#1e293b',
        }
      });
      chartRef.current = chart;

      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });
      seriesRef.current = series;
      markersPluginRef.current = createSeriesMarkers(series);
    }

    const ohlc = data.ohlc || [];
    if (ohlc.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    seriesRef.current?.setData(ohlc as any);

    const lookbackTimestamp = Math.floor(Date.now() / 1000) - (lookbackDays * 86400);

    const markers: SeriesMarker<Time>[] = [];
    const newAlerts: MarketAlert[] = [];
    const signals = data.ith_itl || [];
    
    signals.forEach((signal) => {
      let matchingCandle = ohlc.find(c => c.time === signal.time);
      if (!matchingCandle) {
        for(let i = ohlc.length - 1; i >= 0; i--) {
           if ((ohlc[i].time as number) <= signal.time) {
              matchingCandle = ohlc[i];
              break;
           }
        }
      }
      
      if (!matchingCandle) return;

      const isITH = signal.type === 1;
      const shouldShow = (matchingCandle.time as number) >= lookbackTimestamp;

      if (shouldShow) {
        const termLabel = signal.term === 'Internal' ? 'Int' : 'Ext';
        const tfPrefix = signal.timeframe ? `[${signal.timeframe}] ` : '';
        
        markers.push({
          time: matchingCandle.time,
          position: isITH ? 'aboveBar' : 'belowBar',
          color: isITH ? '#ef4444' : '#10b981',
          shape: isITH ? 'arrowDown' : 'arrowUp',
          text: `${tfPrefix}${termLabel} ${isITH ? 'ITH' : 'ITL'}`,
          size: 2,
        });

        newAlerts.push({
          id: `${signal.time}-${signal.timeframe || 'current'}-${isITH ? 'ITH' : 'ITL'}`,
          time: new Date((signal.time as number) * 1000).toLocaleString(),
          type: isITH ? 'ITH' : 'ITL',
          subtype: `${tfPrefix}${signal.term} ${isITH ? 'ITH' : 'ITL'}`,
          price: signal.level.toFixed(2),
          timestamp: signal.time as number
        });
      }
    });

    const sweeps = data.sweeps || [];
    sweeps.forEach((sweep) => {
      let matchingCandle = ohlc.find(c => c.time === sweep.time);
      if (!matchingCandle) {
        for(let i = ohlc.length - 1; i >= 0; i--) {
           if ((ohlc[i].time as number) <= sweep.time) {
              matchingCandle = ohlc[i];
              break;
           }
        }
      }

      if (!matchingCandle) return;

      const isITH_Sweep = sweep.type === 1;
      const inWindow = isTimeInWindow(matchingCandle.time as number, sweepStart, sweepEnd);
      const withinLookback = (matchingCandle.time as number) >= lookbackTimestamp;
      
      const shouldShow = withinLookback && (!filterSweepsByWindow || inWindow);

      if (shouldShow) {
        const tfPrefix = sweep.timeframe ? `[${sweep.timeframe}] ` : '';

        markers.push({
          time: matchingCandle.time,
          position: isITH_Sweep ? 'aboveBar' : 'belowBar',
          color: '#fbbf24',
          shape: 'circle',
          text: `${tfPrefix}SWEEP`,
          size: 1,
        });

        newAlerts.push({
          id: `${sweep.time}-${sweep.timeframe || 'current'}-SWEEP`,
          time: new Date((sweep.time as number) * 1000).toLocaleString(),
          type: 'SWEEP',
          price: sweep.level.toFixed(2),
          subtype: `${tfPrefix}${isITH_Sweep ? 'ITH Sweep' : 'ITL Sweep'}`,
          timestamp: sweep.time as number
        });
      }
    });

    markersPluginRef.current?.setMarkers(markers.sort((a, b) => (a.time as number) - (b.time as number)));
    
    // Call the parent to update alerts (wrap in setTimeout to avoid updating state during render if it happens to clash)
    setTimeout(() => {
      onAlertsUpdate(newAlerts.sort((a, b) => b.timestamp - a.timestamp));
    }, 0);

    chartRef.current.timeScale().fitContent();
    
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
  }, [data, lookbackDays, sweepStart, sweepEnd, filterSweepsByWindow, onAlertsUpdate]);

  return <div ref={chartContainerRef} className="absolute inset-0" />;
}
