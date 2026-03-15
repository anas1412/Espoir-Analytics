import express from 'express';
import cors from 'cors';
import YahooFinance from 'yahoo-finance2';
import dotenv from 'dotenv';
import { calculateFVG, calculateSwingHighsLows, calculateITH_ITL, calculateSweeps, calculateIFVGs, calculateConfirmations, Candle, Sweep } from './smc';

dotenv.config();

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

  console.log(`[API] Request: timeframe=${timeframe}, swingLength=${swingLength}, strictMode=${strictMode}, minFvgRatio=${minFvgRatio}`);

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

    // 3. Cascading Confirmation (1m -> 3m -> 5m)
    const m1_ohlc = await getHistoricalData('GC=F', '1m', 7);
    const m3_ohlc = aggregateData(m1_ohlc, 3);
    const m5_ohlc = aggregateData(m1_ohlc, 5);

    const checkConfirmationsCascading = (sweepsToProcess: Sweep[], timeframe: string, ohlc_data: Candle[], isStopHuntPass: boolean = false) => {
      const fvgs_raw = calculateFVG(ohlc_data, 0);
      const ifvgs = calculateIFVGs(ohlc_data, fvgs_raw);
      const swings = calculateSwingHighsLows(ohlc_data, 5);
      return calculateConfirmations(ohlc_data, sweepsToProcess, fvgs_raw, ifvgs, swings, timeframe, isStopHuntPass);
    };

    // Step 1: Primary Check (1m)
    const confirmations = checkConfirmationsCascading(sweeps, '1m', m1_ohlc);

    // Step 2: Cascade Primary to 3m/5m
    const cascadePrimary = async () => {
      // 3m
      const cascadingM3 = confirmations.map((c, i) => c.status === 'Cascading' ? i : -1).filter(i => i !== -1);
      if (cascadingM3.length > 0) {
        const m3_res = checkConfirmationsCascading(cascadingM3.map(i => sweeps[i]), '3m', m3_ohlc);
        m3_res.forEach((res, idx) => confirmations[cascadingM3[idx]] = res);
      }
      // 5m
      const cascadingM5 = confirmations.map((c, i) => c.status === 'Cascading' ? i : -1).filter(i => i !== -1);
      if (cascadingM5.length > 0) {
        const m5_res = checkConfirmationsCascading(cascadingM5.map(i => sweeps[i]), '5m', m5_ohlc);
        m5_res.forEach((res, idx) => confirmations[cascadingM5[idx]] = res);
      }
    };

    await cascadePrimary();

    // Step 3: Stop Hunt Logic (The 2nd Chance)
    // For Primary legs that were Violated or Invalid (0 FVGs)
    const huntableIndices = confirmations
      .map((c, i) => (c.status === 'Violated' || (c.status === 'Invalid' && c.ifvgCount === 0)) ? i : -1)
      .filter(i => i !== -1);

    if (huntableIndices.length > 0) {
      for (const idx of huntableIndices) {
        const primary = confirmations[idx];
        const isITH = primary.type === 1;

        // Find Second Sweep: price must sweep the Primary Leg Extreme
        let secondSweep: Sweep | null = null;
        for (let i = primary.legEndIndex + 1; i < m1_ohlc.length; i++) {
          const c = m1_ohlc[i];
          const swept = isITH ? (c.high > primary.extremePrice) : (c.low < primary.extremePrice);
          if (swept) {
            secondSweep = {
              index: i,
              time: c.time as number,
              type: primary.type,
              level: primary.extremePrice,
              sourceIndex: primary.legEndIndex, // New leg starts from old extreme
              timeframe: '1m'
            };
            break;
          }
        }

        if (secondSweep) {
          // Found a Second Sweep! Now check 1m for this SH leg
          let sh_res = checkConfirmationsCascading([secondSweep], '1m', m1_ohlc, true)[0];
          
          // Cascade SH leg to 3m
          if (sh_res.status === 'Cascading') {
            sh_res = checkConfirmationsCascading([secondSweep], '3m', m3_ohlc, true)[0];
          }
          // Cascade SH leg to 5m
          if (sh_res.status === 'Cascading') {
            sh_res = checkConfirmationsCascading([secondSweep], '5m', m5_ohlc, true)[0];
          }

          if (sh_res.status === 'Confirmed') {
            // If Stop Hunt is confirmed, it replaces the primary invalidation
            confirmations[idx] = sh_res;
          } else {
            // Keep it as Hunting or Violated to show in logs
            confirmations[idx].status = 'Hunting';
          }
        }
      }
    }

    console.log(`[API] Returning ${ohlc.length} candles, ${sweeps.length} sweeps, ${confirmations.filter(c => c.status === 'Confirmed').length} confirmed`);
    res.json({ ohlc, fvgs, swings, ith_itl, sweeps, confirmations });
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
