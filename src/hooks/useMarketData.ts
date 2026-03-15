import { useState, useEffect } from 'react';
import type { ChartData } from '../types';

interface UseMarketDataParams {
  timeframe: string;
  swingLength: number;
  showMtf: boolean;
  strictMode: boolean;
  minFvgRatio: number;
}

export const useMarketData = ({ timeframe, swingLength, showMtf, strictMode, minFvgRatio }: UseMarketDataParams) => {
  const [data, setData] = useState<ChartData>({ ohlc: [], ith_itl: [], sweeps: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      console.log(`Fetching: timeframe=${timeframe}, swingLength=${swingLength}, strictMode=${strictMode}, minFvgRatio=${minFvgRatio}`);
      
      try {
        if (!showMtf) {
          const res = await fetch(`${apiUrl}/api/gold?timeframe=${timeframe}&range=30d&swingLength=${swingLength}&strictMode=${strictMode}&minFvgRatio=${minFvgRatio}`);
          const result = await res.json();
          
          if (!isMounted) return;

          if (result.error) {
            setError(result.error);
            setData({ ohlc: [], ith_itl: [], sweeps: [] });
          } else {
            setData(result);
          }
        } else {
          const allTfs = ['1m', '3m', '5m', '15m', '30m', '1h', '4h'];
          const fetchTf = async (tf: string) => {
             const response = await fetch(`${apiUrl}/api/gold?timeframe=${tf}&range=30d&swingLength=${swingLength}&strictMode=${strictMode}&minFvgRatio=${minFvgRatio}`);
             const json = await response.json();
             // Append timeframe property to signals
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             if (json.ith_itl) json.ith_itl.forEach((s: any) => s.timeframe = tf);
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             if (json.sweeps) json.sweeps.forEach((s: any) => s.timeframe = tf);
             return json;
          };
          
          const results = await Promise.all(allTfs.map(fetchTf));
          if (!isMounted) return;

          const mainResult = results[allTfs.indexOf(timeframe)];
          
          if (!mainResult || mainResult.error) {
            setError(mainResult?.error || 'Failed to fetch main timeframe');
            setData({ ohlc: [], ith_itl: [], sweeps: [] });
            return;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let combinedIthItl: any[] = [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let combinedSweeps: any[] = [];
          
          for (let i=0; i < allTfs.length; i++) {
             if (results[i] && !results[i].error) {
                 combinedIthItl = combinedIthItl.concat(results[i].ith_itl || []);
                 combinedSweeps = combinedSweeps.concat(results[i].sweeps || []);
             }
          }

          mainResult.ith_itl = combinedIthItl;
          mainResult.sweeps = combinedSweeps;
          
          setData(mainResult);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Fetch error:', err);
        setError('Failed to fetch data from backend. Ensure server is running.');
        setData({ ohlc: [], ith_itl: [], sweeps: [] });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [timeframe, swingLength, showMtf, strictMode, minFvgRatio]);

  return { data, loading, error };
};
