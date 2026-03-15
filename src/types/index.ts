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

export interface IFVG {
  index: number;
  time: number;
  type: 1 | -1;
  top: number;
  bottom: number;
  inversionTime: number;
  inversionIndex: number;
}

export interface Confirmation {
  id: string;
  type: 1 | -1;
  timeframe: string;
  status: 'Confirmed' | 'Invalid' | 'Cascading' | 'Violated';
  sweepTime: number;
  sweepPrice: number;
  ifvgCount: number;
  ifvg?: IFVG;
  legStartIndex: number;
  legEndIndex: number;
  isStopHunt?: boolean;
  stopHuntCount?: number;
  violationTime?: number;
}

export interface ChartData {
  ohlc: Candle[];
  ith_itl: ITH_ITL[];
  sweeps: Sweep[];
  confirmations: Confirmation[];
}

export interface MarketAlert {
  id: string;
  time: string;
  type: 'ITH' | 'ITL' | 'SWEEP' | 'CONFIRMATION' | 'CASCADING' | 'INVALID';
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
  wickColor: string;
  borderColor: string;
}
