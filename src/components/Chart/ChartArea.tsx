import { useEffect, useRef } from 'react';
import { createChart, CrosshairMode, type ISeriesApi, type SeriesMarker, type Time, CandlestickSeries, createSeriesMarkers, HistogramSeries } from 'lightweight-charts';
import type { ChartData, MarketAlert } from '../../types';
import { isTimeInWindow, timeframeToSeconds } from '../../utils/time';
import { SESSIONS, isInSession, isNewDay } from '../../utils/sessions';

interface ChartAreaProps {
  data: ChartData;
  timeframe: string;
  lookbackDays: number;
  sweepStart: string;
  sweepEnd: string;
  filterSweepsByWindow: boolean;
  onAlertsUpdate: (alerts: MarketAlert[]) => void;
  resetCounter: number;
  showSessions: boolean;
  showDayDividers: boolean;
  londonColor: string;
  nyColor: string;
}

export function ChartArea({ data, timeframe, lookbackDays, sweepStart, sweepEnd, filterSweepsByWindow, onAlertsUpdate, resetCounter, showSessions, showDayDividers, londonColor, nyColor }: ChartAreaProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionSeriesRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dividerSeriesRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersPluginRef = useRef<any>(null);
  const isFirstLoadRef = useRef(true);

  // 1. Initial Chart Setup
  useEffect(() => {
    if (!chartContainerRef.current) return;

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
        autoScale: true,
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

    // Create Session Series
    sessionSeriesRef.current = [];
    SESSIONS.forEach((session) => {
      const sessSeries = chart.addSeries(HistogramSeries, {
        color: 'rgba(0,0,0,0)',
        priceFormat: { type: 'volume' },
        priceScaleId: 'sessions',
        base: 0,
      });
      chart.priceScale('sessions').applyOptions({
        scaleMargins: { top: 0, bottom: 0 },
        visible: false,
      });
      sessionSeriesRef.current.push({ name: session.name, series: sessSeries, config: session });
    });

    // Create Divider Series
    dividerSeriesRef.current = chart.addSeries(HistogramSeries, {
      color: 'rgba(113, 113, 122, 0.2)',
      priceFormat: { type: 'volume' },
      priceScaleId: 'dividers',
      base: 0,
    });
    chart.priceScale('dividers').applyOptions({
      scaleMargins: { top: 0, bottom: 0 },
      visible: false,
    });

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !chartRef.current) return;
      const { width, height } = entries[0].contentRect;
      chartRef.current.applyOptions({ width, height });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // 2. Data & Sessions Update (Runs on OHLC data change or toggle)
  useEffect(() => {
    if (!chartRef.current || !data.ohlc || data.ohlc.length === 0) return;
    const ohlc = data.ohlc;

    seriesRef.current?.setData(ohlc as any);

    // Update Sessions Data
    sessionSeriesRef.current.forEach(({ series, config }) => {
      if (!showSessions) {
        series.setData([]);
        return;
      }
      const sessionData = ohlc.map(c => ({
        time: c.time,
        value: isInSession(c.time as number, config.start, config.end) ? 1 : 0,
      }));
      series.setData(sessionData);
    });

    // Update Dividers Data
    if (dividerSeriesRef.current) {
      if (!showDayDividers) {
        dividerSeriesRef.current.setData([]);
      } else {
        const dividerData = ohlc.map((c, i) => ({
          time: c.time,
          value: i > 0 && isNewDay(ohlc[i-1].time as number, c.time as number) ? 1 : 0,
        }));
        dividerSeriesRef.current.setData(dividerData);
      }
    }

    // Auto-fit on initial load
    if (isFirstLoadRef.current) {
      const timeScale = chartRef.current.timeScale();
      const lastIndex = ohlc.length - 1;
      timeScale.setVisibleLogicalRange({
        from: Math.max(0, lastIndex - 150),
        to: lastIndex + 10,
      });
      isFirstLoadRef.current = false;
    }
  }, [data.ohlc, showSessions, showDayDividers]);

  // 3. Color Update (High Performance - No setData)
  useEffect(() => {
    if (!chartRef.current) return;

    sessionSeriesRef.current.forEach(({ series, config }) => {
      const hex = config.name === 'London' ? londonColor : nyColor;
      // Faster hex to rgba
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      series.applyOptions({ color: `rgba(${r}, ${g}, ${b}, 0.08)` });
    });
  }, [londonColor, nyColor]);

  // 4. Markers & Alerts Update
  useEffect(() => {
    if (!chartRef.current || !data.ohlc || data.ohlc.length === 0) return;
    const ohlc = data.ohlc;
    const lookbackTimestamp = Math.floor(Date.now() / 1000) - (lookbackDays * 86400);

    const pinpointTime = (signalTime: number, signalLevel: number, signalTf: string | undefined, type: 1 | -1): number => {
      if (!signalTf || signalTf === timeframe) return signalTime;
      
      const tfSeconds = timeframeToSeconds(signalTf);
      const endTime = signalTime + tfSeconds;
      
      const matchingCandle = ohlc.find(c => {
        const t = c.time as number;
        if (t < signalTime || t >= endTime) return false;
        return type === 1 ? c.high === signalLevel : c.low === signalLevel;
      });
      
      return matchingCandle ? (matchingCandle.time as number) : signalTime;
    };

    const markers: SeriesMarker<Time>[] = [];
    const newAlerts: MarketAlert[] = [];
    const signals = data.ith_itl || [];
    
    signals.forEach((signal) => {
      const preciseTime = pinpointTime(signal.time, signal.level, signal.timeframe, signal.type);
      let matchingCandle = ohlc.find(c => c.time === preciseTime);
      
      if (!matchingCandle) {
        for(let i = ohlc.length - 1; i >= 0; i--) {
           if ((ohlc[i].time as number) <= preciseTime) {
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
      const preciseTime = pinpointTime(sweep.time, sweep.level, sweep.timeframe, sweep.type);
      let matchingCandle = ohlc.find(c => c.time === preciseTime);
      
      if (!matchingCandle) {
        for(let i = ohlc.length - 1; i >= 0; i--) {
           if ((ohlc[i].time as number) <= preciseTime) {
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
  }, [data.ith_itl, data.sweeps, lookbackDays, sweepStart, sweepEnd, filterSweepsByWindow, onAlertsUpdate, timeframe]);

  // 5. Handle Reset View
  useEffect(() => {
    if (chartRef.current && data.ohlc.length > 0) {
      const timeScale = chartRef.current.timeScale();
      const lastIndex = data.ohlc.length - 1;
      timeScale.setVisibleLogicalRange({
        from: Math.max(0, lastIndex - 150),
        to: lastIndex + 10,
      });
    }
  }, [resetCounter]);


  return <div ref={chartContainerRef} className="absolute inset-0" />;
}
