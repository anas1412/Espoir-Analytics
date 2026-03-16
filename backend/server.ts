import express from 'express';
import cors from 'cors';
import YahooFinance from 'yahoo-finance2';
import dotenv from 'dotenv';
import { calculateFVG, calculateSwingHighsLows, calculateITH_ITL, calculateSweeps, calculateIFVGs, calculateConfirmations, Candle, Sweep } from './smc';

dotenv.config();

const now = () => new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

const yahooFinance = new YahooFinance();
const app = express();
app.use(cors());

// Fetching helper to avoid repetition and handle deduplication
async function getHistoricalData(symbol: string, interval: string, lookbackDays: number): Promise<Candle[]> {
  const result: any = await yahooFinance.chart(symbol, {
    period1: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    interval: interval as any,
  });

  if (!result || !result.quotes) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawOhlc = result.quotes.map((q: any) => ({
    time: Math.floor(new Date(q.date).getTime() / 1000),
    open: q.open,
    high: q.high,
    low: q.low,
    close: q.close,
    volume: q.volume
  })).filter((q: Candle) => q.open !== null && q.high !== null && q.low !== null && q.close !== null);

  // Deduplicate and ensure ascending order
  const deduped: Candle[] = [];
  const seenTimes = new Set<number>();
  for (const candle of rawOhlc) {
    const t = candle.time as number;
    if (!seenTimes.has(t)) {
      deduped.push(candle);
      seenTimes.add(t);
    }
  }

  return deduped.sort((a, b) => (a.time as number) - (b.time as number));
}

function aggregateData(ohlc: Candle[], factor: number): Candle[] {
  const aggregated: Candle[] = [];
  for (let i = 0; i < ohlc.length; i += factor) {
    const chunk = ohlc.slice(i, i + factor);
    if (chunk.length === 0) continue;
    
    aggregated.push({
      time: chunk[0].time,
      open: chunk[0].open,
      high: Math.max(...chunk.map(c => c.high)),
      low: Math.min(...chunk.map(c => c.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((sum, c) => sum + (c.volume || 0), 0)
    });
  }
  return aggregated;
}

app.get('/api/gold', async (req, res) => {
  const timeframe = (req.query.timeframe as string) || '15m';
  const swingLength = parseInt(req.query.swingLength as string) || 5;
  const strictMode = req.query.strictMode !== 'false';
  const minFvgRatio = parseFloat(req.query.minFvgRatio as string) || 0;

  console.log(`${now()} [API] Request: timeframe=${timeframe}, swingLength=${swingLength}, strictMode=${strictMode}, minFvgRatio=${minFvgRatio}`);

  try {
    // 1. Fetch primary data
    let primaryTimeframe = timeframe;
    let primaryLookback = 30;
    let aggregationFactor = 1;

    if (timeframe === '3m') {
      primaryTimeframe = '1m';
      aggregationFactor = 3;
      primaryLookback = 7;
    } else if (timeframe === '4h') {
      primaryTimeframe = '1h';
      aggregationFactor = 4;
    } else if (timeframe === '1m') {
      primaryLookback = 7;
    }

    let ohlc = await getHistoricalData('GC=F', primaryTimeframe, primaryLookback);
    if (aggregationFactor > 1) {
      ohlc = aggregateData(ohlc, aggregationFactor);
    }

    // 2. Base analysis
    const fvgs = calculateFVG(ohlc, minFvgRatio);
    const swings = calculateSwingHighsLows(ohlc, swingLength);
    const ith_itl = calculateITH_ITL(ohlc, swings, fvgs, timeframe, strictMode);
    const sweeps = calculateSweeps(ohlc, ith_itl);

    // 3. Always calculate M1, M3, M5 sweeps and confirmations (regardless of requested timeframe)
    const m1_ohlc = await getHistoricalData('GC=F', '1m', 7);
    const m3_ohlc = aggregateData(m1_ohlc, 3);
    const m5_ohlc = aggregateData(m1_ohlc, 5);

    // Calculate swings and FVGs for each timeframe
    const m1_swings = calculateSwingHighsLows(m1_ohlc, swingLength);
    const m3_swings = calculateSwingHighsLows(m3_ohlc, swingLength);
    const m5_swings = calculateSwingHighsLows(m5_ohlc, swingLength);

    const m1_fvgs = calculateFVG(m1_ohlc, minFvgRatio);
    const m3_fvgs = calculateFVG(m3_ohlc, minFvgRatio);
    const m5_fvgs = calculateFVG(m5_ohlc, minFvgRatio);

    // Calculate ITH/ITL for each timeframe
    const m1_ith_itl = calculateITH_ITL(m1_ohlc, m1_swings, m1_fvgs, '1m', strictMode);
    const m3_ith_itl = calculateITH_ITL(m3_ohlc, m3_swings, m3_fvgs, '3m', strictMode);
    const m5_ith_itl = calculateITH_ITL(m5_ohlc, m5_swings, m5_fvgs, '5m', strictMode);

    // Calculate sweeps for each timeframe
    const m1_sweeps = calculateSweeps(m1_ohlc, m1_ith_itl);
    const m3_sweeps = calculateSweeps(m3_ohlc, m3_ith_itl);
    const m5_sweeps = calculateSweeps(m5_ohlc, m5_ith_itl);

    // 4. Calculate confirmations for each timeframe
    const checkConfirmationsCascading = (sweepsToProcess: Sweep[], tf: string, ohlcData: Candle[], isStopHuntPass: boolean = false) => {
      const fvgsRaw = calculateFVG(ohlcData, minFvgRatio);
      const ifvgs = calculateIFVGs(ohlcData, fvgsRaw);
      const swingData = calculateSwingHighsLows(ohlcData, swingLength);
      const result = calculateConfirmations(ohlcData, sweepsToProcess, fvgsRaw, ifvgs, swingData, tf, isStopHuntPass);
      
      const statusCounts = result.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`${now()} [CONFIRMATION] ${tf}${isStopHuntPass ? ' (Stop Hunt)' : ''}: ${result.length} analyzed -> ${JSON.stringify(statusCounts)}`);
      
      return result;
    };

    // Get base confirmations for each timeframe
    let m1_confirmations = checkConfirmationsCascading(m1_sweeps, '1m', m1_ohlc);
    let m3_confirmations = checkConfirmationsCascading(m3_sweeps, '3m', m3_ohlc);
    let m5_confirmations = checkConfirmationsCascading(m5_sweeps, '5m', m5_ohlc);

    // Add cascade steps to each
    const addCascadeSteps = (confArr: any[], tf: string) => {
      confArr.forEach(c => {
        c.cascadeSteps = [{ timeframe: tf, status: c.status, ifvgCount: c.ifvgCount }];
      });
      return confArr;
    };

    m1_confirmations = addCascadeSteps(m1_confirmations, '1m');
    m3_confirmations = addCascadeSteps(m3_confirmations, '3m');
    m5_confirmations = addCascadeSteps(m5_confirmations, '5m');

    // Cascade M1 -> M3 -> M5 for each
    const cascadeTimeframe = (baseConfirmations: any[], baseSweeps: Sweep[], baseOhlc: Candle[], tf: string, higherOhlc: Candle[], higherTf: string) => {
      const cascading = baseConfirmations.filter(c => c.status === 'Cascading');
      if (cascading.length > 0) {
        console.log(`${now()} [CASCADE] Cascading ${cascading.length} sweeps from ${tf} to ${higherTf}`);
        const cascadedSweeps = baseSweeps.filter((_, i) => baseConfirmations[i].status === 'Cascading');
        const higherConf = checkConfirmationsCascading(cascadedSweeps, higherTf, higherOhlc);
        
        higherConf.forEach((res, idx) => {
          const origIdx = baseConfirmations.findIndex(c => c.status === 'Cascading' && c.timeframe === tf);
          if (origIdx !== -1) {
            baseConfirmations[origIdx] = res;
            baseConfirmations[origIdx].cascadeSteps = [
              { timeframe: tf, status: 'Cascading', ifvgCount: baseConfirmations[origIdx].ifvgCount },
              { timeframe: higherTf, status: res.status, ifvgCount: res.ifvgCount }
            ];
          }
        });
      }
      return baseConfirmations;
    };

    // Run cascades for each timeframe
    m1_confirmations = cascadeTimeframe(m1_confirmations, m1_sweeps, m1_ohlc, '1m', m3_ohlc, '3m');
    m3_confirmations = cascadeTimeframe(m3_confirmations, m3_sweeps, m3_ohlc, '3m', m5_ohlc, '5m');

    // Stop Hunt for each timeframe
    const addStopHunt = (confirmations: any[], sweeps: Sweep[], ohlcData: Candle[], tf: string) => {
      const huntable = confirmations.filter(c => c.status === 'Violated' || (c.status === 'Invalid' && c.ifvgCount === 0));
      console.log(`${now()} [STOP HUNT ${tf}] Found ${huntable.length} huntable setups`);
      
      for (const primary of huntable) {
        const isITH = primary.type === 1;
        let secondSweep: Sweep | null = null;
        
        for (let i = primary.legEndIndex + 1; i < ohlcData.length; i++) {
          const c = ohlcData[i];
          const swept = isITH ? (c.high > primary.extremePrice) : (c.low < primary.extremePrice);
          if (swept) {
            secondSweep = {
              index: i,
              time: typeof c.time === 'string' ? parseInt(c.time) : c.time,
              type: primary.type,
              level: primary.extremePrice,
              sourceIndex: primary.legEndIndex,
              sourceTime: primary.sweepTime,
              originalSourceTime: primary.legStartTime,
              timeframe: tf
            };
            break;
          }
        }

        if (secondSweep) {
          console.log(`${now()} [STOP HUNT ${tf}] Checking Stop Hunt leg`);
          const shResults = checkConfirmationsCascading([secondSweep], tf, ohlcData, true);
          let shRes = shResults.length > 0 ? shResults[0] : null;
          
          if (shRes && shRes.status === 'Cascading') {
            const m3Idx = m3_sweeps.findIndex(s => s.time === secondSweep!.time && s.type === secondSweep!.type);
            if (m3Idx !== -1) {
              const shM3 = checkConfirmationsCascading([m3_sweeps[m3Idx]], '3m', m3_ohlc, true);
              shRes = shM3.length > 0 ? shM3[0] : shRes;
            }
          }
          
          if (shRes && shRes.status === 'Cascading') {
            const m5Idx = m5_sweeps.findIndex(s => s.time === secondSweep!.time && s.type === secondSweep!.type);
            if (m5Idx !== -1) {
              const shM5 = checkConfirmationsCascading([m5_sweeps[m5Idx]], '5m', m5_ohlc, true);
              shRes = shM5.length > 0 ? shM5[0] : shRes;
            }
          }

          if (shRes && shRes.status === 'Confirmed') {
            const idx = confirmations.findIndex(c => c.sweepTime === primary.sweepTime && c.type === primary.type);
            if (idx !== -1) confirmations[idx] = shRes;
          }
        }
      }
      return confirmations;
    };

    m1_confirmations = addStopHunt(m1_confirmations, m1_sweeps, m1_ohlc, '1m');
    m3_confirmations = addStopHunt(m3_confirmations, m3_sweeps, m3_ohlc, '3m');
    m5_confirmations = addStopHunt(m5_confirmations, m5_sweeps, m5_ohlc, '5m');

    // Combine all confirmations
    const allConfirmations = [...m1_confirmations, ...m3_confirmations, ...m5_confirmations];

    console.log(`${now()} [API] Returning ${ohlc.length} candles, ${sweeps.length} sweeps, ${allConfirmations.filter(c => c.status === 'Confirmed').length} confirmed (M1: ${m1_confirmations.filter(c => c.status === 'Confirmed').length}, M3: ${m3_confirmations.filter(c => c.status === 'Confirmed').length}, M5: ${m5_confirmations.filter(c => c.status === 'Confirmed').length})`);
    res.json({ ohlc, fvgs, swings, ith_itl, sweeps, confirmations: allConfirmations });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching data:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch gold data', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
