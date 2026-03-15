import express from 'express';
import cors from 'cors';
import YahooFinance from 'yahoo-finance2';
import dotenv from 'dotenv';
import { calculateFVG, calculateSwingHighsLows, calculateITH_ITL, calculateSweeps, calculateIFVGs, calculateConfirmations, Candle } from './smc';

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

    // Step 1: Check 1m
    const m1_fvgs_raw = calculateFVG(m1_ohlc, 0);
    const m1_ifvgs = calculateIFVGs(m1_ohlc, m1_fvgs_raw);
    const m1_swings = calculateSwingHighsLows(m1_ohlc, 5);
    const confirmations = calculateConfirmations(m1_ohlc, sweeps, m1_fvgs_raw, m1_ifvgs, m1_swings, '1m');

    // Step 2: Cascade to 3m
    const cascadingIndicesM3 = confirmations
      .map((c, i) => c.status === 'Cascading' ? i : -1)
      .filter(i => i !== -1);

    if (cascadingIndicesM3.length > 0) {
      const m3_fvgs_raw = calculateFVG(m3_ohlc, 0);
      const m3_ifvgs = calculateIFVGs(m3_ohlc, m3_fvgs_raw);
      const m3_swings = calculateSwingHighsLows(m3_ohlc, 5);
      const m3_results = calculateConfirmations(m3_ohlc, cascadingIndicesM3.map(i => sweeps[i]), m3_fvgs_raw, m3_ifvgs, m3_swings, '3m');
      m3_results.forEach((res, idx) => confirmations[cascadingIndicesM3[idx]] = res);
    }

    // Step 3: Cascade to 5m
    const cascadingIndicesM5 = confirmations
      .map((c, i) => c.status === 'Cascading' ? i : -1)
      .filter(i => i !== -1);

    if (cascadingIndicesM5.length > 0) {
      const m5_fvgs_raw = calculateFVG(m5_ohlc, 0);
      const m5_ifvgs = calculateIFVGs(m5_ohlc, m5_fvgs_raw);
      const m5_swings = calculateSwingHighsLows(m5_ohlc, 5);
      const m5_results = calculateConfirmations(m5_ohlc, cascadingIndicesM5.map(i => sweeps[i]), m5_fvgs_raw, m5_ifvgs, m5_swings, '5m');
      m5_results.forEach((res, idx) => confirmations[cascadingIndicesM5[idx]] = res);
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
