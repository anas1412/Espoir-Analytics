import { useEffect, useRef } from 'react';
import { createChart, CrosshairMode, type ISeriesApi, type SeriesMarker, type Time, CandlestickSeries, createSeriesMarkers, HistogramSeries, LineSeries } from 'lightweight-charts';
import type { ChartData, MarketAlert, ChartTheme } from '../../types';
import { isTimeInWindow, timeframeToSeconds } from '../../utils/time';
import { SESSIONS, isInSession } from '../../utils/sessions';

interface ChartAreaProps {
  data: ChartData;
  timeframe: string;
  lookbackDays: number;
  levelExpiryDays: number;
  sweepStart: string;
  sweepEnd: string;
  filterSweepsByWindow: boolean;
  onAlertsUpdate: (alerts: MarketAlert[]) => void;
  resetCounter: number;
  showSessions: boolean;
  showDayDividers: boolean;
  londonColor: string;
  nyColor: string;
  sessionOpacity: number;
  theme: ChartTheme;
  timezone: string;
  onRegisterScrollToTime?: (fn: (time: number) => void) => void;
}

export function ChartArea({ data, timeframe, lookbackDays, levelExpiryDays, sweepStart, sweepEnd, filterSweepsByWindow, onAlertsUpdate, resetCounter, showSessions, showDayDividers, londonColor, nyColor, sessionOpacity, theme, timezone, onRegisterScrollToTime }: ChartAreaProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionSeriesRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dividerSeriesRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raySeriesRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersPluginRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const confirmationSeriesRef = useRef<any[]>([]);

  // 1. Initial Chart Setup
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: theme.backgroundColor },
        textColor: theme.textColor,
      },
      grid: {
        vertLines: { color: theme.gridColor },
        horzLines: { color: theme.gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: theme.gridColor,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: timezone 
          });
        },
      },
      rightPriceScale: {
        borderColor: theme.gridColor,
        autoScale: true,
      }
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: theme.upColor,
      downColor: theme.downColor,
      borderVisible: true,
      wickVisible: true,
      borderColor: theme.borderColor,
      wickColor: theme.wickColor,
      wickUpColor: theme.upColor,
      wickDownColor: theme.downColor,
    });
    seriesRef.current = series;
    markersPluginRef.current = createSeriesMarkers(series);

    // Initial Theme Sync
    chart.applyOptions({
      layout: {
        background: { color: theme.backgroundColor },
        textColor: theme.textColor,
      },
      grid: {
        vertLines: { color: theme.gridColor },
        horzLines: { color: theme.gridColor },
      },
      timeScale: {
        borderColor: theme.gridColor,
      },
      rightPriceScale: {
        borderColor: theme.gridColor,
      }
    });

    // Create Session Series
    sessionSeriesRef.current = [];
    SESSIONS.forEach((session) => {
      const sessSeries = chart.addSeries(HistogramSeries, {
        color: 'transparent',
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
      color: '#71717a33',
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

    // Register scrollToTime function with parent
    if (onRegisterScrollToTime) {
      onRegisterScrollToTime((time: number) => {
        if (!chartRef.current) return;
        const timeScale = chartRef.current.timeScale();
        const targetIndex = ohlc.findIndex(c => (c.time as number) >= time);
        if (targetIndex !== -1) {
          // Calculate visible range to center on targetIndex
          const visibleInfo = timeScale.getVisibleRange();
          if (visibleInfo) {
            const currentFrom = visibleInfo.from;
            const currentTo = visibleInfo.to;
            const currentCenter = Math.floor((currentFrom + currentTo) / 2);
            const offset = targetIndex - currentCenter;
            const newFrom = currentFrom + offset;
            const newTo = currentTo + offset;
            timeScale.setVisibleRange({ from: newFrom, to: newTo });
          }
        }
      });
    }

    seriesRef.current?.setData(ohlc as any);

    // Update Sessions Data
    sessionSeriesRef.current.forEach(({ series, config }) => {
      if (!showSessions) {
        series.setData([]);
        return;
      }
      
      const hex = config.name === 'London' ? londonColor : nyColor;
      const alphaHex = Math.round(sessionOpacity * 255).toString(16).padStart(2, '0');
      series.applyOptions({ color: `${hex}${alphaHex}` });

      const sessionData = ohlc.map(c => ({
        time: c.time,
        value: isInSession(c.time as number, config.start, config.end) ? 1 : 0,
      }));
      series.setData(sessionData);
    });

    // Update Dividers Data (PERMANENTLY HIDDEN)
    if (dividerSeriesRef.current) {
        dividerSeriesRef.current.setData([]);
    }

    // Auto-fit is now handled by Effect 5 (Markers & Alerts)
  }, [data.ohlc, showSessions, showDayDividers]);

  // 3. Theme Update (High Performance)
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    chartRef.current.applyOptions({
      layout: {
        background: { color: theme.backgroundColor },
        textColor: theme.textColor,
      },
      grid: {
        vertLines: { color: theme.gridColor },
        horzLines: { color: theme.gridColor },
      },
      timeScale: {
        borderColor: theme.gridColor,
      },
      rightPriceScale: {
        borderColor: theme.gridColor,
      }
    });

    seriesRef.current.applyOptions({
      upColor: theme.upColor,
      downColor: theme.downColor,
      borderColor: theme.borderColor,
      wickColor: theme.wickColor,
      wickUpColor: theme.upColor,
      wickDownColor: theme.downColor,
    });
  }, [theme]);

  // 4. Session Color Update (High Performance)
  useEffect(() => {
    if (!chartRef.current) return;

    sessionSeriesRef.current.forEach(({ series, config }) => {
      const hex = config.name === 'London' ? londonColor : nyColor;
      const alphaHex = Math.round(sessionOpacity * 255).toString(16).padStart(2, '0');
      series.applyOptions({ color: `${hex}${alphaHex}` });
    });
  }, [londonColor, nyColor, sessionOpacity]);

  // 5. Markers & Alerts Update
  useEffect(() => {
    if (!chartRef.current || !data.ohlc || data.ohlc.length === 0) return;
    const ohlc = data.ohlc;
    const lookbackTimestamp = Math.floor(Date.now() / 1000) - (lookbackDays * 86400);
    const expiryTimestamp = Math.floor(Date.now() / 1000) - (levelExpiryDays * 86400);

    const pinpointTime = (signalTime: number, signalTf: string | undefined, type: 1 | -1): number => {
      if (!signalTf || signalTf === timeframe) return signalTime;
      const tfSeconds = timeframeToSeconds(signalTf);
      const endTime = signalTime + tfSeconds;
      let bestCandle: any = null;
      for (let i = 0; i < ohlc.length; i++) {
        const t = ohlc[i].time as number;
        if (t < signalTime) continue;
        if (t >= endTime) break;
        if (!bestCandle) { bestCandle = ohlc[i]; continue; }
        if (type === 1) { if (ohlc[i].high > bestCandle.high) bestCandle = ohlc[i]; } 
        else { if (ohlc[i].low < bestCandle.low) bestCandle = ohlc[i]; }
      }
      return bestCandle ? (bestCandle.time as number) : signalTime;
    };

    // Clear previous Ray Series
    raySeriesRef.current.forEach(s => chartRef.current?.removeSeries(s));
    raySeriesRef.current = [];

    // Clear previous Confirmation Series
    confirmationSeriesRef.current.forEach(s => chartRef.current?.removeSeries(s));
    confirmationSeriesRef.current = [];

    const markers: SeriesMarker<Time>[] = [];
    const newAlerts: MarketAlert[] = [];
    const signals = data.ith_itl || [];
    const sweeps = data.sweeps || [];
    const confData = data.confirmations || [];
    
    signals.forEach((signal) => {
      const isITH = signal.type === 1;
      const preciseTime = pinpointTime(signal.time, signal.timeframe, signal.type);
      
      // Filter by scan depth lookback for performance/clutter
      if (preciseTime < lookbackTimestamp) return;

      // Determine Sweep Time (accurate to current chart)
      let sweepTime = signal.sweepTime;
      if (!sweepTime) {
        const sIdx = ohlc.findIndex(c => (c.time as number) > preciseTime && (isITH ? c.high > signal.level : c.low < signal.level));
        if (sIdx !== -1) sweepTime = ohlc[sIdx].time as number;
      }

      // Check Expiry - only if never swept
      const isExpired = !sweepTime && preciseTime < expiryTimestamp;
      if (isExpired) return;

      // FIX: Only draw ray if swept. Otherwise creates vertical line to end of chart
      if (!sweepTime) {
        // Still add marker for unswept levels
        const tfPrefix = signal.timeframe ? `[${signal.timeframe}] ` : '';
        const termLabel = signal.term === 'Internal' ? 'Int' : 'Ext';
        markers.push({
          time: preciseTime as any,
          position: isITH ? 'aboveBar' : 'belowBar',
          color: isITH ? '#f43f5e' : '#10b981',
          shape: 'square',
          text: `${tfPrefix}${termLabel} ${isITH ? 'ITH' : 'ITL'}`,
          size: 0,
        });
        newAlerts.push({
          id: `${signal.time}-${signal.timeframe || 'current'}-${isITH ? 'ITH' : 'ITL'}`,
          time: new Date((signal.time as number) * 1000).toLocaleString('en-GB', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZone: timezone
          }),
          type: isITH ? 'ITH' : 'ITL',
          subtype: `${tfPrefix}${signal.term} ${isITH ? 'ITH' : 'ITL'}`,
          price: signal.level.toFixed(2),
          timestamp: signal.time as number,
          timeframe: signal.timeframe,
        });
        return;
      }

      const tfPrefix = signal.timeframe ? `[${signal.timeframe}] ` : '';

      // Create Ray Series
      const rayColor = isITH ? '#f43f5e99' : '#10b98199';
      const raySeries = chartRef.current.addSeries(LineSeries, {
        color: rayColor,
        lineWidth: 1,
        lineStyle: 2, // Dashed
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        autoscaleInfoProvider: () => null, // Don't affect Y-axis scale
      });
      
      raySeries.setData([
        { time: preciseTime as any, value: signal.level },
        { time: sweepTime as any, value: signal.level },
      ]);
      raySeriesRef.current.push(raySeries);

      // Add Text Marker at the start
      const termLabel = signal.term === 'Internal' ? 'Int' : 'Ext';
      markers.push({
        time: preciseTime as any,
        position: isITH ? 'aboveBar' : 'belowBar',
        color: isITH ? '#f43f5e' : '#10b981',
        shape: 'square',
        text: `${tfPrefix}${termLabel} ${isITH ? 'ITH' : 'ITL'}`,
        size: 0,
      });

      // Add Alert (simple - no linking)
      newAlerts.push({
        id: `${signal.time}-${signal.timeframe || 'current'}-${isITH ? 'ITH' : 'ITL'}`,
          time: new Date((signal.time as number) * 1000).toLocaleString('en-GB', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZone: timezone
          }),
        type: isITH ? 'ITH' : 'ITL',
        subtype: `${tfPrefix}${signal.term} ${isITH ? 'ITH' : 'ITL'}`,
        price: signal.level.toFixed(2),
        timestamp: signal.time as number,
        timeframe: signal.timeframe,
      });
    });

    // Handle Sweeps markers (subtle yellow dots at capture points)
    sweeps.forEach((sweep) => {
      const preciseTime = pinpointTime(sweep.time, sweep.timeframe, sweep.type);
      if (preciseTime < lookbackTimestamp) return;

      const inWindow = isTimeInWindow(preciseTime, sweepStart, sweepEnd);
      if (filterSweepsByWindow && !inWindow) return;

      markers.push({
        time: preciseTime as any,
        position: sweep.type === 1 ? 'aboveBar' : 'belowBar',
        color: '#ff0000',
        shape: 'circle',
        text: 'SWEEP',
        size: 0.2,
      });

      // Add Sweep Alert (simple - no linking)
      newAlerts.push({
        id: `sweep-${sweep.time}-${sweep.timeframe || 'current'}`,
        time: new Date((sweep.time as number) * 1000).toLocaleString('en-GB', { 
          day: '2-digit', month: '2-digit', year: 'numeric', 
          hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZone: timezone
        }),
        type: 'SWEEP',
        subtype: `${sweep.timeframe || 'current'} SWEEP`,
        price: sweep.level.toFixed(2),
        timestamp: sweep.time as number,
        timeframe: sweep.timeframe,
      });
    });

    // 2. Handle Confirmations (Confirmed, Invalid, Cascading, Violated, Hunting)
    confData.forEach((conf) => {
      // Filter by scan depth
      if (conf.sweepTime < lookbackTimestamp) return;

      // Filter by session window
      const inWindow = isTimeInWindow(conf.sweepTime, sweepStart, sweepEnd);
      if (filterSweepsByWindow && !inWindow) return;

      const isShort = conf.type === 1;
      const isSH = conf.legType === 'StopHunt';
      const timeStr = new Date(conf.sweepTime * 1000).toLocaleString('en-GB', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'UTC'
      });
      
      if (conf.status === 'Confirmed' && conf.ifvg) {
        // Draw the iFVG box
        const boxColor = isShort ? '#f43f5e' : '#10b981';
        
        const createBoxLine = (val: number) => {
          if (conf.ifvg!.time === conf.ifvg!.inversionTime) return;
          const s = chartRef.current.addSeries(LineSeries, {
            color: boxColor,
            lineWidth: 2,
            lineStyle: isSH ? 2 : 0, // Dashed for Stop Hunt iFVG
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
            autoscaleInfoProvider: () => null,
          });
          s.setData([
            { time: conf.ifvg!.time as any, value: val },
            { time: conf.ifvg!.inversionTime as any, value: val }
          ]);
          confirmationSeriesRef.current.push(s);
        };

        createBoxLine(conf.ifvg.top);
        createBoxLine(conf.ifvg.bottom);

        // Add "CONFIRMED" marker
        markers.push({
          time: conf.ifvg.inversionTime as any,
          position: isShort ? 'belowBar' : 'aboveBar',
          color: boxColor,
          shape: 'arrowUp',
          text: `${isSH ? 'SH ' : ''}CONFIRMED ${conf.timeframe}`,
          size: 1,
        });

        newAlerts.push({
          id: conf.id,
          time: timeStr,
          type: 'CONFIRMATION',
          subtype: `${conf.timeframe} ${isSH ? 'SH ' : ''}CONFIRMED`,
          price: conf.sweepPrice.toFixed(2),
          timestamp: conf.sweepTime,
          timeframe: conf.timeframe,
        });
      } else if (conf.status === 'Cascading') {
        newAlerts.push({
          id: conf.id,
          time: timeStr,
          type: 'CASCADING',
          subtype: `${conf.timeframe} Multi FVGs (${conf.ifvgCount})${isSH ? ' SH' : ''}`,
          price: conf.sweepPrice.toFixed(2),
          timestamp: conf.sweepTime,
          timeframe: conf.timeframe,
        });
      } else if (conf.status === 'Violated') {
        newAlerts.push({
          id: conf.id,
          time: timeStr,
          type: 'VIOLATED',
          subtype: `${conf.timeframe} Extreme Violated`,
          price: conf.sweepPrice.toFixed(2),
          timestamp: conf.sweepTime,
          timeframe: conf.timeframe,
        });
      } else if (conf.status === 'Hunting') {
        newAlerts.push({
          id: conf.id,
          time: timeStr,
          type: 'STOP_HUNT',
          subtype: `${conf.timeframe} Hunting 2nd Chance`,
          price: conf.sweepPrice.toFixed(2),
          timestamp: conf.sweepTime,
          timeframe: conf.timeframe,
        });
      } else if (conf.status === 'Invalid') {
        const reason = conf.ifvgCount === 0 ? 'No qualifying FVG' : 'Expired';
        newAlerts.push({
          id: conf.id,
          time: timeStr,
          type: 'INVALID',
          subtype: `${conf.timeframe} ${reason}${isSH ? ' SH' : ''}`,
          price: conf.sweepPrice.toFixed(2),
          timestamp: conf.sweepTime,
          timeframe: conf.timeframe,
        });
      }
    });

    markersPluginRef.current?.setMarkers(markers.sort((a, b) => (a.time as number) - (b.time as number)));

    // Set visible range AFTER all series are added (including ray series)
    // This must be in Effect 5 because adding ray series triggers auto-fit to oldest data
    const lastIndex = ohlc.length - 1;
    chartRef.current.priceScale('right').applyOptions({ autoScale: true });
    chartRef.current.timeScale().setVisibleLogicalRange({
      from: Math.max(0, lastIndex - 150),
      to: lastIndex + 10,
    });
    
    setTimeout(() => {
      onAlertsUpdate(newAlerts.sort((a, b) => b.timestamp - a.timestamp));
    }, 0);
  }, [data.ith_itl, data.sweeps, data.confirmations, lookbackDays, levelExpiryDays, sweepStart, sweepEnd, filterSweepsByWindow, onAlertsUpdate, timeframe, resetCounter]);

  // 6. Reset View Handler - also updates timezone
  useEffect(() => {
    if (!chartRef.current || !data.ohlc || data.ohlc.length === 0) return;
    
    // Update tickMarkFormatter with new timezone
    chartRef.current.timeScale().applyOptions({
      tickMarkFormatter: (time: number) => {
        const date = new Date(time * 1000);
        return date.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: timezone 
        });
      },
    });
    
    // Force chart to recalculate (updates crosshair tooltip timezone)
    chartRef.current.timeScale().applyOptions({});
    
    // Reset visible range
    const lastIndex = data.ohlc.length - 1;
    chartRef.current.priceScale('right').applyOptions({ autoScale: true });
    chartRef.current.timeScale().setVisibleLogicalRange({
      from: Math.max(0, lastIndex - 150),
      to: lastIndex + 10,
    });
  }, [resetCounter, data.ohlc.length, timezone]);

  return <div ref={chartContainerRef} className="absolute inset-0" />;
}
