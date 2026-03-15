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
          background: { color: '#000000' },
          textColor: '#71717a',
        },
        grid: {
          vertLines: { color: '#0f0f0f' },
          horzLines: { color: '#0f0f0f' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: '#1a1a1a',
        },
        rightPriceScale: {
          borderColor: '#1a1a1a',
        }
      });
      chartRef.current = chart;

      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#f43f5e',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e',
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
          color: isITH ? '#f43f5e' : '#10b981',
          shape: isITH ? 'arrowDown' : 'arrowUp',
          text: `${tfPrefix}${termLabel} ${isITH ? 'ITH' : 'ITL'}`,
          size: 1,
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
    
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !chartRef.current) return;
      const { width, height } = entries[0].contentRect;
      chartRef.current.applyOptions({ width, height });
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [data, lookbackDays, sweepStart, sweepEnd, filterSweepsByWindow, onAlertsUpdate]);

  return <div ref={chartContainerRef} className="absolute inset-0" />;
}
