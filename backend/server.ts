import express from 'express';
import cors from 'cors';
import YahooFinance from 'yahoo-finance2';
import dotenv from 'dotenv';
import { calculateFVG, calculateSwingHighsLows, calculateITH_ITL, calculateSweeps, Candle } from './smc';

dotenv.config();

const yahooFinance = new YahooFinance();
const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('SMC Backend is running and listening.');
});

// A simple in-memory cache
// let lastFetchTime = 0;
// let cachedData: any = null;

app.get('/api/gold', async (req, res) => {
  const timeframe = (req.query.timeframe as string) || '15m';
  const range = (req.query.range as string) || '5d';
  const swingLength = parseInt(req.query.swingLength as string) || 5;
  const strictMode = req.query.strictMode !== 'false';

  console.log(`[API] Request: timeframe=${timeframe}, range=${range}, swingLength=${swingLength}, strictMode=${strictMode}`);

  try {
    let finalTimeframe = timeframe;
    let needsAggregation = false;
    let aggregationFactor = 1;

    if (timeframe === '3m') {
      finalTimeframe = '1m';
      needsAggregation = true;
      aggregationFactor = 3;
    } else if (timeframe === '4h') {
      finalTimeframe = '1h';
      needsAggregation = true;
      aggregationFactor = 4;
    }

    let lookbackDays = 30;
    if (finalTimeframe === '1m') {
      lookbackDays = 7;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.chart('GC=F', {
      period1: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Adjusted lookback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      interval: finalTimeframe as any,
    });

    if (!result || !result.quotes) {
      throw new Error('No data returned from Yahoo Finance');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ohlc: Candle[] = result.quotes.map((q: any) => ({
      time: Math.floor(new Date(q.date).getTime() / 1000),
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume
    })).filter((q: Candle) => q.open !== null && q.high !== null && q.low !== null && q.close !== null);

    if (needsAggregation) {
      const aggregated: Candle[] = [];
      for (let i = 0; i < ohlc.length; i += aggregationFactor) {
        const chunk = ohlc.slice(i, i + aggregationFactor);
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
      ohlc = aggregated;
    }

    const fvgs = calculateFVG(ohlc);
    const swings = calculateSwingHighsLows(ohlc, swingLength);
    const ith_itl = calculateITH_ITL(ohlc, swings, fvgs, timeframe, strictMode);
    const sweeps = calculateSweeps(ohlc, ith_itl);

    console.log(`[API] Returning ${ohlc.length} candles, ${ith_itl.length} ITH/ITL, and ${sweeps.length} sweeps`);
    res.json({ ohlc, fvgs, swings, ith_itl, sweeps });
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
