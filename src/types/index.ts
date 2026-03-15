import type { Time } from 'lightweight-charts';

export interface Candle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ITH_ITL {
  index: number;
  time: number;
  type: 1 | -1;
  level: number;
  term: 'Internal' | 'External';
  timeframe?: string;
  sweepTime?: number;
  sweepIndex?: number;
}

export interface Sweep {
  index: number;
  time: number;
  type: 1 | -1;
  level: number;
  sourceIndex: number;
  timeframe?: string;
}

export interface ChartData {
  ohlc: Candle[];
  ith_itl: ITH_ITL[];
  sweeps: Sweep[];
}

export interface MarketAlert {
  id: string;
  time: string;
  type: 'ITH' | 'ITL' | 'SWEEP';
  subtype: string;
  price: string;
  timestamp: number;
}

export interface ChartTheme {
  upColor: string;
  downColor: string;
  backgroundColor: string;
  gridColor: string;
  textColor: string;
}
