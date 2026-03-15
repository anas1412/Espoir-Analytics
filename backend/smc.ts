export interface Candle {
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FVG {
  index: number;
  direction: 1 | -1;
  top: number;
  bottom: number;
  mitigatedIndex: number | null;
}

export interface Swing {
  index: number;
  type: 1 | -1; // 1 for High, -1 for Low
  level: number;
}

export interface ITH_ITL {
  index: number;
  time: number;
  type: 1 | -1; // 1 for ITH, -1 for ITL
  level: number;
  term: 'Internal' | 'External';
  timeframe?: string;
}

export interface Sweep {
  index: number;
  time: number;
  type: 1 | -1; // 1 for Sweep of ITH (Bullish Sweep), -1 for Sweep of ITL (Bearish Sweep)
  level: number;
  sourceIndex: number; // The index of the ITH/ITL that was swept
  timeframe?: string;
}

export function calculateFVG(ohlc: Candle[]): FVG[] {
  const fvgs: FVG[] = [];
  
  for (let i = 1; i < ohlc.length - 1; i++) {
    const prev = ohlc[i - 1];
    const curr = ohlc[i];
    const next = ohlc[i + 1];
    
    // Bullish FVG
    if (prev.high < next.low && curr.close > curr.open) {
      fvgs.push({
        index: i,
        direction: 1,
        top: next.low,
        bottom: prev.high,
        mitigatedIndex: null
      });
    }
    // Bearish FVG
    else if (prev.low > next.high && curr.close < curr.open) {
      fvgs.push({
        index: i,
        direction: -1,
        top: prev.low,
        bottom: next.high,
        mitigatedIndex: null
      });
    }
  }

  // Calculate mitigation
  for (const fvg of fvgs) {
    for (let j = fvg.index + 2; j < ohlc.length; j++) {
      if (fvg.direction === 1 && ohlc[j].low <= fvg.top) {
        fvg.mitigatedIndex = j;
        break;
      }
      if (fvg.direction === -1 && ohlc[j].high >= fvg.bottom) {
        fvg.mitigatedIndex = j;
        break;
      }
    }
  }

  return fvgs;
}

export function calculateSwingHighsLows(ohlc: Candle[], swingLength: number = 5): Swing[] {
  const swings: Swing[] = [];
  
  for (let i = swingLength; i < ohlc.length - swingLength; i++) {
    let isHigh = true;
    let isLow = true;
    
    const currHigh = ohlc[i].high;
    const currLow = ohlc[i].low;
    
    for (let j = i - swingLength; j <= i + swingLength; j++) {
      if (i === j) continue;
      if (ohlc[j].high >= currHigh) isHigh = false;
      if (ohlc[j].low <= currLow) isLow = false;
    }
    
    if (isHigh) {
      swings.push({ index: i, type: 1, level: currHigh });
    } else if (isLow) {
      swings.push({ index: i, type: -1, level: currLow });
    }
  }
  
  // Clean consecutive swings of the same type
  const cleanedSwings: Swing[] = [];
  for (let i = 0; i < swings.length; i++) {
    if (cleanedSwings.length === 0) {
      cleanedSwings.push(swings[i]);
      continue;
    }
    
    const last = cleanedSwings[cleanedSwings.length - 1];
    if (last.type === swings[i].type) {
      if (last.type === 1 && swings[i].level > last.level) {
        cleanedSwings[cleanedSwings.length - 1] = swings[i];
      } else if (last.type === -1 && swings[i].level < last.level) {
        cleanedSwings[cleanedSwings.length - 1] = swings[i];
      }
    } else {
      cleanedSwings.push(swings[i]);
    }
  }

  return cleanedSwings;
}

export function calculateITH_ITL(ohlc: Candle[], swings: Swing[], fvgs: FVG[], timeframe: string = '15m', strictMode: boolean = true): ITH_ITL[] {
  const ith_itl: ITH_ITL[] = [];

  // Classification: < 5m is Internal, >= 5m is External
  // Timeframe formats: '1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'
  let term: 'Internal' | 'External' = 'External';
  const match = timeframe.match(/^(\d+)([mhd])$/);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit === 'm' && value < 5) {
      term = 'Internal';
    }
  }

  console.log(`[SMC] Processing ${ohlc.length} candles for ${timeframe} (${term})`);
  console.log(`[SMC] Found ${swings.length} swings and ${fvgs.length} FVGs`);

  let rejectedMitigated = 0;
  let rejectedRange = 0;

  for (const swing of swings) {
    if (swing.type === 1) { // Swing High
      for (const fvg of fvgs) {
        if (fvg.index >= swing.index) continue; // FVG must form before the swing
        if (fvg.direction === -1) { // Bearish FVG
          const isMitigatedLater = fvg.mitigatedIndex === null || fvg.mitigatedIndex >= swing.index;
          if (isMitigatedLater) {
            const inRange = strictMode 
              ? (swing.level >= fvg.bottom && swing.level <= fvg.top)
              : (swing.level >= fvg.bottom); // Discretionary: can pierce above top

            if (inRange) {
              ith_itl.push({ index: swing.index, time: ohlc[swing.index].time as number, type: 1, level: swing.level, term, timeframe });
              break;
            } else {
              rejectedRange++;
            }
          } else {
            rejectedMitigated++;
          }
        }
      }
    } else if (swing.type === -1) { // Swing Low
      for (const fvg of fvgs) {
        if (fvg.index >= swing.index) continue;
        if (fvg.direction === 1) { // Bullish FVG
          const isMitigatedLater = fvg.mitigatedIndex === null || fvg.mitigatedIndex >= swing.index;
          if (isMitigatedLater) {
            const inRange = strictMode
              ? (swing.level >= fvg.bottom && swing.level <= fvg.top)
              : (swing.level <= fvg.top); // Discretionary: can pierce below bottom

            if (inRange) {
              ith_itl.push({ index: swing.index, time: ohlc[swing.index].time as number, type: -1, level: swing.level, term, timeframe });
              break;
            } else {
              rejectedRange++;
            }
          } else {
            rejectedMitigated++;
          }
        }
      }
    }
  }

  console.log(`[SMC] Detected ${ith_itl.length} ITH/ITL signals`);
  console.log(`[SMC] Rejected: ${rejectedMitigated} (Mitigated too early), ${rejectedRange} (Out of price range)`);

  return ith_itl;
}

export function calculateSweeps(ohlc: Candle[], ith_itl: ITH_ITL[]): Sweep[] {
  const sweeps: Sweep[] = [];

  for (const signal of ith_itl) {
    const isITH = signal.type === 1;
    
    // Find the first candle that sweeps the level after the signal index
    for (let i = signal.index + 1; i < ohlc.length; i++) {
      const candle = ohlc[i];
      let swept = false;

      if (isITH) {
        // Sweep of ITH (High)
        if (candle.high > signal.level) {
          swept = true;
        }
      } else {
        // Sweep of ITL (Low)
        if (candle.low < signal.level) {
          swept = true;
        }
      }

      if (swept) {
        sweeps.push({
          index: i,
          time: candle.time as number,
          type: signal.type,
          level: signal.level,
          sourceIndex: signal.index,
          timeframe: signal.timeframe
        });
        // We only take the first sweep for each ITH/ITL as the "signal trigger"
        break;
      }
    }
  }

  console.log(`[SMC] Detected ${sweeps.length} Sweeps of ITH/ITL`);
  return sweeps;
}
