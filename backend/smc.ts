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
  sweepTime?: number;
  sweepIndex?: number;
}

export interface Sweep {
  index: number;
  time: number;
  type: 1 | -1; // 1 for Sweep of ITH (Bullish Sweep), -1 for Sweep of ITL (Bearish Sweep)
  level: number;
  sourceIndex: number; // The index of the ITH/ITL that was swept
  timeframe?: string;
}

export interface IFVG {
  index: number;
  time: number;
  type: 1 | -1; // 1 for Bullish FVG that was Inverted Down (Bearish iFVG), -1 for Bearish FVG that was Inverted Up (Bullish iFVG)
  top: number;
  bottom: number;
  inversionTime: number;
  inversionIndex: number;
}

export interface Confirmation {
  id: string;
  type: 1 | -1; // 1 for Sweep of ITH (Short Reversal), -1 for Sweep of ITL (Long Reversal)
  timeframe: string;
  status: 'Confirmed' | 'Invalid' | 'Cascading' | 'Violated';
  sweepTime: number;
  sweepPrice: number;
  ifvgCount: number;
  ifvg?: IFVG;
  legStartIndex: number;
  legEndIndex: number;
  legExtreme: number;
  isStopHunt?: boolean;
}

export function calculateFVG(ohlc: Candle[], minFvgRatio: number = 0): FVG[] {
  const fvgs: FVG[] = [];
  
  for (let i = 1; i < ohlc.length - 1; i++) {
    const prev = ohlc[i - 1];
    const curr = ohlc[i];
    const next = ohlc[i + 1];
    
    // Bullish FVG
    if (prev.high < next.low && curr.close > curr.open) {
      const gapSize = next.low - prev.high;
      const candleSize = curr.high - curr.low;
      const ratio = candleSize === 0 ? 0 : gapSize / candleSize;
      
      if (ratio >= minFvgRatio) {
        fvgs.push({
          index: i,
          direction: 1,
          top: next.low,
          bottom: prev.high,
          mitigatedIndex: null
        });
      }
    }
    // Bearish FVG
    else if (prev.low > next.high && curr.close < curr.open) {
      const gapSize = prev.low - next.high;
      const candleSize = curr.high - curr.low;
      const ratio = candleSize === 0 ? 0 : gapSize / candleSize;
      
      if (ratio >= minFvgRatio) {
        fvgs.push({
          index: i,
          direction: -1,
          top: prev.low,
          bottom: next.high,
          mitigatedIndex: null
        });
      }
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

  for (const swing of swings) {
    if (swing.type === 1) { // Swing High
      for (const fvg of fvgs) {
        if (fvg.index >= swing.index) continue;
        if (fvg.direction === -1) { // Bearish FVG
          const isMitigatedLater = fvg.mitigatedIndex === null || fvg.mitigatedIndex >= swing.index;
          if (isMitigatedLater) {
            const inRange = strictMode 
              ? (swing.level >= fvg.bottom && swing.level <= fvg.top)
              : (swing.level >= fvg.bottom);

            if (inRange) {
              ith_itl.push({ index: swing.index, time: ohlc[swing.index].time as number, type: 1, level: swing.level, term, timeframe });
              break;
            }
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
              : (swing.level <= fvg.top);

            if (inRange) {
              ith_itl.push({ index: swing.index, time: ohlc[swing.index].time as number, type: -1, level: swing.level, term, timeframe });
              break;
            }
          }
        }
      }
    }
  }

  return ith_itl;
}

export function calculateSweeps(ohlc: Candle[], ith_itl: ITH_ITL[]): Sweep[] {
  const sweeps: Sweep[] = [];

  for (const signal of ith_itl) {
    const isITH = signal.type === 1;
    
    for (let i = signal.index + 1; i < ohlc.length; i++) {
      const candle = ohlc[i];
      let swept = false;

      if (isITH) {
        if (candle.high > signal.level) swept = true;
      } else {
        if (candle.low < signal.level) swept = true;
      }

      if (swept) {
        const sweepTime = candle.time as number;
        signal.sweepTime = sweepTime;
        signal.sweepIndex = i;

        sweeps.push({
          index: i,
          time: sweepTime,
          type: signal.type,
          level: signal.level,
          sourceIndex: signal.index,
          timeframe: signal.timeframe
        });
        break;
      }
    }
  }

  console.log(`[SMC] Detected ${sweeps.length} Sweeps of ITH/ITL`);
  return sweeps;
}

export function calculateIFVGs(ohlc: Candle[], fvgs: FVG[]): IFVG[] {
  const ifvgs: IFVG[] = [];

  for (const fvg of fvgs) {
    if (fvg.mitigatedIndex !== null) {
      for (let i = fvg.mitigatedIndex; i < ohlc.length; i++) {
        const candle = ohlc[i];
        let inverted = false;

        if (fvg.direction === 1) {
          if (candle.close < fvg.bottom) inverted = true;
        } else {
          if (candle.close > fvg.top) inverted = true;
        }

        if (inverted) {
          ifvgs.push({
            index: fvg.index,
            time: ohlc[fvg.index].time as number,
            type: fvg.direction,
            top: fvg.top,
            bottom: fvg.bottom,
            inversionTime: ohlc[i].time as number,
            inversionIndex: i
          });
          break;
        }
      }
    }
  }

  return ifvgs;
}

export function calculateConfirmations(
  ohlc: Candle[],
  sweeps: Sweep[],
  fvgs: FVG[],
  ifvgs: IFVG[],
  swings: Swing[],
  timeframe: string
): Confirmation[] {
  const confirmations: Confirmation[] = [];

  for (const sweep of sweeps) {
    let legStartIndex = sweep.sourceIndex;
    const isITH = sweep.type === 1;

    for (let i = swings.length - 1; i >= 0; i--) {
      const s = swings[i];
      if (s.index < sweep.index && s.index > sweep.sourceIndex) {
        if (isITH && s.type === -1) {
          legStartIndex = s.index;
          break;
        } else if (!isITH && s.type === 1) {
          legStartIndex = s.index;
          break;
        }
      }
    }

    const processLeg = (start: number, end: number, isSH: boolean = false): Confirmation => {
      const legFVGs = fvgs.filter(fvg => 
        fvg.index >= start && 
        fvg.index <= end &&
        (isITH ? fvg.direction === 1 : fvg.direction === -1)
      );

      const slice = ohlc.slice(start, end + 1);
      const legExtreme = isITH 
        ? Math.max(...slice.map(c => c.high)) 
        : Math.min(...slice.map(c => c.low));

      let status: 'Confirmed' | 'Invalid' | 'Cascading' | 'Violated' = 'Invalid';
      let confirmedIFVG: IFVG | undefined = undefined;

      if (legFVGs.length === 0) {
        status = 'Invalid';
      } else if (legFVGs.length > 1) {
        status = 'Cascading';
      } else if (legFVGs.length === 1) {
        const targetFVG = legFVGs[0];
        const inversion = ifvgs.find(ifvg => ifvg.index === targetFVG.index && ifvg.inversionIndex >= end);
        
        if (inversion) {
          let violated = false;
          for (let i = end + 1; i < inversion.inversionIndex; i++) {
            if (isITH ? ohlc[i].high > legExtreme : ohlc[i].low < legExtreme) {
              violated = true;
              break;
            }
          }
          if (violated) {
            status = 'Violated';
          } else {
            status = 'Confirmed';
            confirmedIFVG = inversion;
          }
        } else {
          for (let i = end + 1; i < ohlc.length; i++) {
            if (isITH ? ohlc[i].high > legExtreme : ohlc[i].low < legExtreme) {
              status = 'Violated';
              break;
            }
          }
        }
      }

      const tfValue = parseInt(timeframe);
      if (timeframe.includes('m') && tfValue >= 5 && status === 'Cascading') {
        status = 'Invalid';
      }

      return {
        id: `${ohlc[end].time}-${timeframe}-${isITH ? 'Short' : 'Long'}${isSH ? '-SH' : ''}`,
        type: isITH ? 1 : -1,
        timeframe,
        status,
        sweepTime: ohlc[end].time as number,
        sweepPrice: sweep.level,
        ifvgCount: legFVGs.length,
        ifvg: confirmedIFVG,
        legStartIndex: start,
        legEndIndex: end,
        legExtreme,
        isStopHunt: isSH
      };
    };

    let result = processLeg(legStartIndex, sweep.index);

    if (result.status === 'Violated' || (result.status === 'Invalid' && result.ifvgCount === 0)) {
      let shSweepIndex = -1;
      for (let i = sweep.index + 1; i < ohlc.length; i++) {
        if (isITH ? ohlc[i].high > result.legExtreme : ohlc[i].low < result.legExtreme) {
          shSweepIndex = i;
          break;
        }
      }

      if (shSweepIndex !== -1) {
        const shResult = processLeg(sweep.index, shSweepIndex, true);
        result = shResult;
      }
    }

    confirmations.push(result);
  }

  return confirmations;
}
